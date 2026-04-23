const express = require("express");
const router = express.Router();
const SensorDataRaw = require("../models/sensor_data_raw");
const IrrigationDetails = require("../models/irrigation_details");
const { runMLPrediction } = require("../services/mlService");

// ─────────────────────────────────────────
// POST /api/esp32/data
// ESP32 sends sensor readings here
// ─────────────────────────────────────────
router.post("/data", async (req, res) => {
  try {
    const {
      device_id,
      temperature,
      humidity,
      soil_moisture,
      ph,
      water_level,
      rainfall,
      crop_type
    } = req.body;

    // Validate required fields
    if (!device_id || temperature === undefined || humidity === undefined || 
        soil_moisture === undefined || ph === undefined || water_level === undefined) {
      return res.status(400).json({ error: "Missing required sensor data" });
    }

    // 1. Save raw sensor data to MongoDB
    const sensorEntry = new SensorDataRaw({
      device_id,
      temperature,
      humidity,
      soil_moisture,
      ph,
      water_level,
      rainfall: rainfall || 0,
      crop_type: crop_type || "wheat",
      timestamp: new Date()
    });
    await sensorEntry.save();
    console.log(`✅ Sensor data saved for ${device_id}:`, sensorEntry);

    // 2. Run ML prediction using your existing mlService
    const mlInput = {
      device_id,
      temperature,
      humidity,
      soil_moisture,
      ph,
      water_level,
      rainfall: rainfall || 0,
      crop_type: crop_type || "wheat"
    };

    const prediction = await runMLPrediction(mlInput);

    // 3. Save irrigation decision
    const irrigationEntry = new IrrigationDetails({
      device_id,
      should_irrigate: prediction.should_irrigate,
      water_amount: prediction.water_amount,
      pump_command: prediction.should_irrigate ? "PUMP_ON" : "PUMP_OFF",
      timestamp: new Date()
    });
    await irrigationEntry.save();
    console.log(`✅ Irrigation decision saved for ${device_id}:`, irrigationEntry);

    // 4. Return decision to ESP32
    const command = prediction.should_irrigate ? "PUMP_ON" : "PUMP_OFF";
    const duration_minutes = prediction.should_irrigate ? Math.ceil(prediction.water_amount / 10) : 0; // Assuming 10 liters per minute

    res.json({
      command: command,
      duration_minutes: duration_minutes,
      success: true
    });

  } catch (err) {
    console.error("ESP32 data error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/esp32/command/:device_id
// ESP32 polls this to get latest command
// ─────────────────────────────────────────
router.get("/command/:device_id", async (req, res) => {
  try {
    const { device_id } = req.params;

    const latest = await IrrigationDetails.findOne({ device_id })
      .sort({ timestamp: -1 });

    if (!latest) {
      return res.json({ command: "PUMP_OFF", duration_minutes: 0 });
    }

    const command = latest.should_irrigate ? "PUMP_ON" : "PUMP_OFF";
    const duration_minutes = latest.should_irrigate ? Math.ceil(latest.water_amount / 10) : 0;

    res.json({
      command: command,
      duration_minutes: duration_minutes
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/esp32/latest/:device_id
// Frontend fetches live sensor data
// ─────────────────────────────────────────
router.get("/latest/:device_id", async (req, res) => {
  try {
    const latest = await SensorDataRaw.findOne({ device_id: req.params.device_id })
      .sort({ timestamp: -1 });

    if (!latest) {
      return res.status(404).json({ error: "No sensor data found" });
    }

    res.json({
      device_id: latest.device_id,
      temperature: latest.temperature,
      humidity: latest.humidity,
      soil_moisture: latest.soil_moisture,
      ph: latest.ph,
      water_level: latest.water_level,
      rainfall: latest.rainfall,
      crop_type: latest.crop_type,
      timestamp: latest.timestamp
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/esp32/trigger/:device_id
// Manually trigger a reading (returns latest stored data)
// ─────────────────────────────────────────
router.post("/trigger/:device_id", async (req, res) => {
  try {
    const { device_id } = req.params;

    const latest = await SensorDataRaw.findOne({ device_id })
      .sort({ timestamp: -1 });

    if (!latest) {
      return res.status(404).json({ error: "No sensor data found for this device" });
    }

    res.json({
      success: true,
      data: {
        device_id: latest.device_id,
        temperature: latest.temperature,
        humidity: latest.humidity,
        soil_moisture: latest.soil_moisture,
        ph: latest.ph,
        water_level: latest.water_level,
        rainfall: latest.rainfall,
        crop_type: latest.crop_type,
        timestamp: latest.timestamp
      }
    });

  } catch (err) {
    console.error("Trigger error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/esp32/pump/:device_id
// Manual pump control
// ─────────────────────────────────────────
router.post("/pump/:device_id", async (req, res) => {
  try {
    const { device_id } = req.params;
    const { action, duration_minutes } = req.body;

    if (!["ON", "OFF"].includes(action)) {
      return res.status(400).json({ error: "Action must be 'ON' or 'OFF'" });
    }

    const should_irrigate = action === "ON";
    const water_amount = should_irrigate ? (duration_minutes || 10) : 0;

    // Save manual command
    const irrigationEntry = new IrrigationDetails({
      device_id,
      should_irrigate,
      water_amount,
      pump_command: should_irrigate ? "PUMP_ON" : "PUMP_OFF",
      timestamp: new Date()
    });
    await irrigationEntry.save();

    console.log(`✅ Manual pump command saved for ${device_id}: ${action} for ${duration_minutes} minutes`);

    res.json({
      success: true,
      command: should_irrigate ? "PUMP_ON" : "PUMP_OFF",
      duration_minutes: water_amount
    });

  } catch (err) {
    console.error("Pump control error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/esp32/history/:device_id
// Returns last 20 sensor readings for analytics
// ─────────────────────────────────────────
router.get("/history/:device_id", async (req, res) => {
  try {
    const { device_id } = req.params;

    const history = await SensorDataRaw.find({ device_id })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({
      success: true,
      data: history.map(entry => ({
        device_id: entry.device_id,
        temperature: entry.temperature,
        humidity: entry.humidity,
        soil_moisture: entry.soil_moisture,
        ph: entry.ph,
        water_level: entry.water_level,
        rainfall: entry.rainfall,
        crop_type: entry.crop_type,
        timestamp: entry.timestamp
      }))
    });

  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;