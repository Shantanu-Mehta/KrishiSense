const express = require('express');
const router = express.Router();
const { validateAndPlan } = require('../services/cropValidationService');
const { runMLPrediction } = require('../services/mlService');
const { buildIrrigationPlan } = require('../services/irrigationPlanService');
const IrrigationPlan = require('../models/IrrigationPlan');
const sensorDataModel = require('../models/sensor_data_raw');

// POST /api/irrigation/plan - Create irrigation plan
router.post('/plan', async (req, res) => {
  try {
    const {
      crop,
      soilType,
      sowingDate,
      fieldArea,
      city,
      state
    } = req.body;

    // Validate required fields
    if (!crop || !soilType || !sowingDate || !fieldArea || !city || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: crop, soilType, sowingDate, fieldArea, city, state'
      });
    }

    // Get latest sensor data from ESP32
    const latestSensorData = await sensorDataModel.findOne()
      .sort({ timestamp: -1 })
      .limit(1);

    if (!latestSensorData) {
      return res.status(400).json({
        success: false,
        error: 'No sensor data available. Please ensure ESP32 device is connected and sending data.'
      });
    }

    // Merge sensor data with user input
    const mergedData = {
      crop,
      soilType,
      sowingDate,
      soilMoisture: latestSensorData.soil_moisture,
      humidity: latestSensorData.humidity,
      waterLevel: latestSensorData.water_level,
      fieldArea,
      city,
      state
    };

    // Step 1: Validate and prepare for ML
    const validationResult = validateAndPlan(mergedData);

    if (!validationResult.passed) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validation: validationResult
      });
    }

    // Step 2: Run ML prediction
    const mlResult = await runMLPrediction(validationResult.mlInput);

    // Step 3: Build irrigation plan
    const irrigationPlan = buildIrrigationPlan(mergedData, mlResult, validationResult);

    // Step 4: Save to database
    const savedPlan = new IrrigationPlan({
      plan_id: `PLAN_${Date.now()}`,
      crop: crop.toLowerCase(),
      soil_type: soilType.toLowerCase(),
      sowing_date: new Date(sowingDate),
      field_area: parseFloat(fieldArea),
      location: `${city}, ${state}`,
      season: validationResult.checks.season.note.includes('Kharif') ? 'Kharif' :
              validationResult.checks.season.note.includes('Rabi') ? 'Rabi' : 'Zaid',
      should_irrigate: mlResult.should_irrigate,
      water_amount_per_session: mlResult.water_amount,
      schedule: irrigationPlan.schedule,
      recommendations: irrigationPlan.recommendations,
      sensor_data: {
        temperature: latestSensorData.temperature,
        humidity: latestSensorData.humidity,
        soil_moisture: latestSensorData.soil_moisture,
        water_level: latestSensorData.water_level,
        timestamp: latestSensorData.timestamp
      },
      created_at: new Date()
    });

    await savedPlan.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Irrigation plan created successfully',
      plan: {
        plan_id: savedPlan.plan_id,
        crop: savedPlan.crop,
        should_irrigate: savedPlan.should_irrigate,
        water_amount_per_session: savedPlan.water_amount_per_session,
        schedule: savedPlan.schedule,
        recommendations: savedPlan.recommendations,
        season: savedPlan.season,
        location: savedPlan.location
      }
    });

  } catch (error) {
    console.error('Error creating irrigation plan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /api/irrigation/plans - Get all irrigation plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await IrrigationPlan.find()
      .sort({ created_at: -1 })
      .select('plan_id crop sowing_date field_area location season should_irrigate water_amount_per_session created_at');

    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error('Error fetching irrigation plans:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/irrigation/plan/:planId - Get specific irrigation plan
router.get('/plan/:planId', async (req, res) => {
  try {
    const plan = await IrrigationPlan.findOne({ plan_id: req.params.planId });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Irrigation plan not found'
      });
    }

    res.json({
      success: true,
      plan: plan
    });
  } catch (error) {
    console.error('Error fetching irrigation plan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;