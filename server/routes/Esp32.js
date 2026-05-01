const express = require("express");
const router = express.Router();
const SensorDataRaw = require("../models/sensor_data_raw");
const IrrigationDetails = require("../models/irrigation_details");
const { runMLPrediction } = require("../services/mlService");





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

    
    if (!device_id || temperature === undefined || humidity === undefined ||
        soil_moisture === undefined || ph === undefined || water_level === undefined) {
      return res.status(400).json({ error: "Missing required sensor data" });
    }

    
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
    const savedDoc = await sensorEntry.save();
    console.log("✅ Saved sensor data:", savedDoc._id);

    
    res.json({
      success: true,
      command: "PUMP_OFF",
      duration_minutes: 0
    });

  } catch (err) {
    console.error("ESP32 data error:", err);
    res.status(500).json({ error: err.message });
  }
});





router.get("/command/:device_id", async (req, res) => {
  try {
    const { device_id } = req.params;

    
    const latest = await IrrigationDetails.findOne({ device_id })
      .sort({ timestamp: -1 });

    if (!latest) {
      return res.json({
        command: "PUMP_OFF",
        duration_minutes: 0,
        is_new_command: false
      });
    }

    
    if (latest.executed === false) {
      
      latest.executed = true;
      await latest.save();

      
      return res.json({
        command: latest.pump_command,
        duration_minutes: latest.water_amount,
        is_new_command: true
      });
    } else {
      
      return res.json({
        command: "PUMP_OFF",
        duration_minutes: 0,
        is_new_command: false
      });
    }

  } catch (err) {
    console.error("Command error:", err);
    res.status(500).json({ error: err.message });
  }
});





router.post("/pump/:device_id", async (req, res) => {
  try {
    const { device_id } = req.params;
    const { action, duration_minutes } = req.body;

    if (!["ON", "OFF"].includes(action)) {
      return res.status(400).json({ error: "Action must be 'ON' or 'OFF'" });
    }

    
    const irrigationEntry = new IrrigationDetails({
      device_id: device_id,
      should_irrigate: action === "ON",
      pump_command: action === "ON" ? "PUMP_ON" : "PUMP_OFF",
      water_amount: duration_minutes,
      executed: false,
      timestamp: new Date()
    });

    await irrigationEntry.save();

    
    res.json({
      success: true,
      command: irrigationEntry.pump_command,
      duration_minutes: irrigationEntry.water_amount
    });

  } catch (err) {
    console.error("Pump control error:", err);
    res.status(500).json({ error: err.message });
  }
});





router.get("/latest/:device_id", async (req, res) => {
  try {
    const latest = await SensorDataRaw.findOne({ device_id: req.params.device_id })
      .sort({ timestamp: -1 });

    if (!latest) {
      return res.json({});
    }

    
    const mlResult = await runMLPrediction(latest.toObject());

    res.json({
      device_id: latest.device_id,
      temperature: latest.temperature,
      humidity: latest.humidity,
      soil_moisture: latest.soil_moisture,
      ph: latest.ph,
      water_level: latest.water_level,
      rainfall: latest.rainfall,
      crop_type: latest.crop_type,
      timestamp: latest.timestamp,
      water_need: mlResult.water_amount,
      should_irrigate: mlResult.should_irrigate
    });
  } catch (err) {
    console.error("Latest data error:", err);
    res.status(500).json({ error: err.message });
  }
});





router.get("/history/:device_id", async (req, res) => {
  try {
    const { device_id } = req.params;

    const history = await SensorDataRaw.find({ device_id })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json(history);

  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: err.message });
  }
});





router.post("/trigger/:device_id", async (req, res) => {
  try {
    const { device_id } = req.params;

    
    const latestDoc = await SensorDataRaw.findOne({ device_id })
      .sort({ timestamp: -1 });

    if (!latestDoc) {
      return res.status(404).json({ error: "No sensor data found for this device" });
    }

    
    const mlResult = await runMLPrediction(latestDoc.toObject());

    
    res.json({
      success: true,
      data: {
        device_id: latestDoc.device_id,
        temperature: latestDoc.temperature,
        humidity: latestDoc.humidity,
        soil_moisture: latestDoc.soil_moisture,
        ph: latestDoc.ph,
        water_level: latestDoc.water_level,
        rainfall: latestDoc.rainfall,
        crop_type: latestDoc.crop_type,
        timestamp: latestDoc.timestamp,
        water_need: mlResult.water_amount,
        should_irrigate: mlResult.should_irrigate
      }
    });

  } catch (err) {
    console.error("Trigger error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;