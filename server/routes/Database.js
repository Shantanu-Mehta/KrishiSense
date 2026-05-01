const express = require('express');
const router = express.Router();

const Irrigation = require('../models/irrigation_details');
const IrrigationPlan = require('../models/IrrigationPlan');
const SensorData = require('../models/sensor_data_raw');


router.get('/plans', async (req, res) => {
  try {
    const plans = await IrrigationPlan.find({})
      .sort({ created_at: -1 })
      .limit(50);

    
    const transformedPlans = await Promise.all(plans.map(async (plan) => {
      
      const latestCommand = await Irrigation.findOne({ device_id: 'ESP32_FIELD_01' })
        .sort({ timestamp: -1 });

      
      const latestSensor = await SensorData.findOne({ device_id: 'ESP32_FIELD_01' })
        .sort({ timestamp: -1 });

      
      let pumpStatus = 'offline';
      if (latestCommand) {
        const timeDiff = Date.now() - new Date(latestCommand.timestamp).getTime();
        const minutesAgo = timeDiff / (1000 * 60);

        if (minutesAgo < 30) { 
          pumpStatus = latestCommand.pump_command === 'PUMP_ON' ? 'running' : 'idle';
        } else {
          pumpStatus = 'idle';
        }
      }

      return {
        _id: plan._id,
        crop_type: plan.crop,
        soil_type: plan.soil_type,
        sowing_date: plan.sowing_date,
        region: plan.location,
        status: plan.should_irrigate, 
        farm_id: plan.plan_id,
        createdAt: plan.created_at,
        recommended_irrigation_mm: plan.water_amount_per_session,
        mlPredictions: {
          optimal_irrigation_days: plan.schedule?.length || 7
        },
        pump_status: pumpStatus,
        sensor_data: latestSensor ? {
          temperature: latestSensor.temperature,
          humidity: latestSensor.humidity,
          soil_moisture: latestSensor.soil_moisture,
          water_level: latestSensor.water_level,
          last_update: latestSensor.timestamp
        } : null
      };
    }));

    res.json(transformedPlans);
  } catch (error) {
    console.error('Error fetching irrigation plans:', error);
    res.status(500).json({ message: 'Failed to fetch irrigation plans', error });
  }
});

module.exports = router;
