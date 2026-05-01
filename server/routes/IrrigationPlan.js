const express = require('express');
const router = express.Router();
const { validateAndPlan } = require('../validateAndPlan_v2');
const { runMLPrediction } = require('../services/mlService');
const { buildIrrigationPlan } = require('../services/irrigationPlanService');
const IrrigationPlan = require('../models/IrrigationPlan');
const sensorDataModel = require('../models/sensor_data_raw');


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

    
    if (!crop || !soilType || !sowingDate || !fieldArea || !city || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: crop, soilType, sowingDate, fieldArea, city, state'
      });
    }

    
    const latestSensorData = await sensorDataModel.findOne()
      .sort({ timestamp: -1 })
      .limit(1);

    
    const sensorData = latestSensorData || {
      soil_moisture: 50,
      humidity: 60,
      water_level: 70,
      temperature: 25,
      ph: 6.5,
      timestamp: new Date()
    };

    
    const mergedData = {
      crop,
      soilType,
      sowingDate,
      soilMoisture: sensorData.soil_moisture,
      humidity: sensorData.humidity,
      waterLevel: sensorData.water_level,
      temperature: sensorData.temperature,
      ph: sensorData.ph,
      fieldArea,
      city,
      state
    };

    
    const validationResult = validateAndPlan(mergedData);

    if (!validationResult.passed) {
      return res.status(400).json({
        success: false,
        error: validationResult.reason || 'Validation failed',
        suggestion: validationResult.suggestion,
        validation: validationResult
      });
    }

    
    const mlResult = await runMLPrediction(validationResult.mlInput);

    
    const irrigationPlan = buildIrrigationPlan(mergedData, mlResult, validationResult);

    
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
      water_amount_per_session: Math.ceil(mlResult.water_amount * parseFloat(fieldArea) * 4046.86),
      schedule: irrigationPlan.schedule,
      recommendations: irrigationPlan.recommendations,
      sensor_data: {
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        soil_moisture: sensorData.soil_moisture,
        water_level: sensorData.water_level,
        ph: sensorData.ph,
        timestamp: sensorData.timestamp
      },
      created_at: new Date()
    });

    await savedPlan.save();

    
    res.status(201).json({
      success: true,
      message: 'Irrigation plan created successfully',
      suggestions: validationResult.suggestions || [],
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

router.patch('/plan/:planId/deactivate', async (req, res) => {
  try {
    const plan = await IrrigationPlan.findOneAndUpdate(
      { plan_id: req.params.planId },
      { should_irrigate: false },
      { new: true }
    );
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Irrigation plan not found' });
    }
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error deactivating irrigation plan:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;