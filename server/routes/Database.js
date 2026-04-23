const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const Form = require('../models/forms');
const Alert = require('../models/alert');
const Irrigation = require('../models/irrigation_details');
const IrrigationPlan = require('../models/IrrigationPlan');
const SensorData = require('../models/sensor_data_raw');
const Predict = require('../models/predict');
const User = require('../models/User');

// Compatibility root endpoints (legacy client calls to /api/data)
router.post('/', upload.single('photo'), async (req, res) => {
  // create using same logic as /forms
  try {
    const { title, description, status, cropType, fieldId, location } = req.body;
    const newForm = new Form({
      title,
      description,
      cropType,
      fieldId,
      location,
      status: typeof status !== 'undefined' ? status === 'true' : true,
      photo: req.file
        ? {
            data: req.file.buffer,
            contentType: req.file.mimetype
          }
        : undefined,
    });
    await newForm.save();
    res.status(201).json({ message: 'Field added', data: newForm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add field', error });
  }
});

router.get('/', async (req, res) => {
  // return forms list
  try {
    const status = req.query.status;
    let query = {};
    if (typeof status !== 'undefined') query.status = status === 'true';
    const items = await Form.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch forms', error });
  }
});

// GET /api/data/plans - Fetch irrigation plans for dashboard
router.get('/plans', async (req, res) => {
  try {
    const plans = await IrrigationPlan.find({})
      .sort({ created_at: -1 })
      .limit(50);

    // Transform plans to match dashboard expectations
    const transformedPlans = await Promise.all(plans.map(async (plan) => {
      // Get latest pump status from irrigation_details
      const latestCommand = await Irrigation.findOne({ device_id: 'ESP32_FIELD_01' })
        .sort({ timestamp: -1 });

      // Get latest sensor data
      const latestSensor = await SensorData.findOne({ device_id: 'ESP32_FIELD_01' })
        .sort({ timestamp: -1 });

      // Determine pump status
      let pumpStatus = 'offline';
      if (latestCommand) {
        const timeDiff = Date.now() - new Date(latestCommand.timestamp).getTime();
        const minutesAgo = timeDiff / (1000 * 60);

        if (minutesAgo < 30) { // Active within last 30 minutes
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
        status: plan.should_irrigate, // Active if should irrigate
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

router.get('/image/:id', async (req, res) => {
  try {
    const doc = await Form.findById(req.params.id);
    if (!doc || !doc.photo || !doc.photo.data) return res.status(404).send('Image not found');
    res.contentType(doc.photo.contentType);
    res.send(doc.photo.data);
  } catch (err) {
    res.status(500).send('Error fetching image');
  }
});

// Forms (add-field)
router.post('/forms', upload.single('photo'), async (req, res) => {
  try {
    const { title, description, status, cropType, fieldId, location } = req.body;
    const newForm = new Form({
      title,
      description,
      cropType,
      fieldId,
      location,
      status: typeof status !== 'undefined' ? status === 'true' : true,
      photo: req.file
        ? {
            data: req.file.buffer,
            contentType: req.file.mimetype
          }
        : undefined,
    });
    await newForm.save();
    res.status(201).json({ message: 'Field added', data: newForm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add field', error });
  }
});

router.get('/forms', async (req, res) => {
  try {
    const status = req.query.status;
    let query = {};
    if (typeof status !== 'undefined') query.status = status === 'true';
    const items = await Form.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch forms', error });
  }
});

router.get('/forms/image/:id', async (req, res) => {
  try {
    const doc = await Form.findById(req.params.id);
    if (!doc || !doc.photo || !doc.photo.data) return res.status(404).send('Image not found');
    res.contentType(doc.photo.contentType);
    res.send(doc.photo.data);
  } catch (err) {
    res.status(500).send('Error fetching image');
  }
});

// Alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch alerts', err });
  }
});

router.post('/alerts', async (req, res) => {
  try {
    const { type, title, message, fieldId } = req.body;
    const a = new Alert({ type, title, message, fieldId });
    await a.save();
    res.status(201).json(a);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create alert', err });
  }
});

router.delete('/alerts/:id', async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove alert', err });
  }
});

// Irrigation details
router.post('/irrigation', async (req, res) => {
  try {
    const data = req.body;
    const d = new Irrigation(data);
    await d.save();
    res.status(201).json(d);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save irrigation details', err });
  }
});

router.get('/irrigation', async (req, res) => {
  try {
    const fieldId = req.query.fieldId;
    const q = fieldId ? { fieldId } : {};
    const items = await Irrigation.find(q).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch irrigation details', err });
  }
});

// Sensor data raw
router.post('/sensor-data', async (req, res) => {
  try {
    const s = new SensorData(req.body);
    await s.save();
    res.status(201).json(s);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save sensor data', err });
  }
});

router.get('/sensor-data', async (req, res) => {
  try {
    const fieldId = req.query.fieldId;
    const limit = parseInt(req.query.limit || '100', 10);
    const q = fieldId ? { fieldId } : {};
    const items = await SensorData.find(q).sort({ timestamp: -1 }).limit(limit);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sensor data', err });
  }
});

// Predictions
router.post('/predict', async (req, res) => {
  try {
    const p = new Predict(req.body);
    await p.save();
    res.status(201).json(p);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save prediction', err });
  }
});

router.get('/predict', async (req, res) => {
  try {
    const fieldId = req.query.fieldId;
    const q = fieldId ? { fieldId } : {};
    const items = await Predict.find(q).sort({ predictedAt: -1 }).limit(100);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch predictions', err });
  }
});

// Users
const bcrypt = require('bcryptjs');
router.post('/users', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const u = new User({ username, email, password: hashed });
    await u.save();
    res.status(201).json({ id: u._id, username: u.username, email: u.email });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user', err });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('username email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', err });
  }
});

// Crop management - Add new crop with sensor data and ML predictions
const weatherService = require('../services/weatherService');
const cropService = require('../services/cropService');
const mlController = require('../services/mlController');
const cropCalendar = require('../cropCalendar');

// Helper to resolve crop calendar entry case-insensitively
const getCalendarForCrop = (cropType) => {
  try {
    if (!cropType) return cropCalendar.Rice || Object.values(cropCalendar)[0];
    const key = Object.keys(cropCalendar).find(k => k.toLowerCase() === cropType.toString().toLowerCase());
    return (key && cropCalendar[key]) ? cropCalendar[key] : (cropCalendar.Rice || Object.values(cropCalendar)[0]);
  } catch (e) {
    return cropCalendar.Rice || Object.values(cropCalendar)[0];
  }
};

// Generate a semi-readable unique farm id
const generateFarmId = () => {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const time = Date.now().toString().slice(-6);
  return `FARM-${time}-${suffix}`;
};

router.post('/crops', upload.single('photo'), async (req, res) => {
  try {
    // Extract all CSV header fields from request body
    // Note: Form sends with % in names (soil_moisture_%, humidity_%)
    // But we store as Python-valid names (soil_moisture_percent, humidity_percent)
    const {
      farm_id,
      region,
      crop_type,
      soil_type,
      'soil_moisture_%': soil_moisture_percent_input,
      soil_moisture_percent: soil_moisture_percent_alt,
      soil_pH,
      temperature_C,
      rainfall_mm,
      'humidity_%': humidity_percent_input,
      humidity_percent: humidity_percent_alt,
      sowing_date,
      harvest_date,
      crop_growth_days,
      NDVI_index,
      status
    } = req.body;

    // Handle both possible field name formats
    const soil_moisture_percent_value = parseFloat(soil_moisture_percent_input || soil_moisture_percent_alt || '50');
    const humidity_percent_value = parseFloat(humidity_percent_input || humidity_percent_alt || '65');
    const soil_pH_value = parseFloat(soil_pH || '7.0');
    const temperature_C_value = parseFloat(temperature_C || '25');
    const rainfall_mm_value = parseFloat(rainfall_mm || '100');
    const NDVI_index_value = parseFloat(NDVI_index || '0.5');
    const crop_growth_days_value = parseInt(crop_growth_days || '120');

    // Ensure a unique farm_id: use provided or auto-generate one
    let finalFarmId = farm_id && farm_id.toString().trim() ? farm_id.toString().trim() : generateFarmId();
    // If a farm with same id exists, generate a new one (up to a few attempts)
    let attempts = 0;
    while (await Form.exists({ farm_id: finalFarmId }) && attempts < 5) {
      finalFarmId = generateFarmId();
      attempts++;
    }

    // Validate required fields
    const requiredFields = ['farm_id', 'region', 'crop_type', 'soil_type', 'sowing_date'];
    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields,
        success: false
      });
    }

    // Prepare crop data for ML processing using exact CSV field names
    const cropData = {
      farm_id: finalFarmId,
      region,
      crop_type: crop_type.toLowerCase(),
      soil_type: soil_type.toLowerCase(),
      'soil_moisture_%': soil_moisture_percent_value, // CSV format for ML
      soil_pH: soil_pH_value,
      temperature_C: temperature_C_value,
      rainfall_mm: rainfall_mm_value,
      'humidity_%': humidity_percent_value, // CSV format for ML
      NDVI_index: NDVI_index_value,
      sowing_date,
      crop_growth_days: crop_growth_days_value
    };

    // Process with ML model and generate schedule
    let mlResult = null;
    let recommendations = [];
    let processingMode = 'ml';

    try {
      // Call ML model with exact CSV field names
      const mlService = require('../services/mlService');
      const cropCalendar = require('../cropCalendar');
      
      const mlPredictions = await mlService.processCropWithML(
        cropData,
        getCalendarForCrop(crop_type)
      );
      
      mlResult = {
        success: true,
        schedule: mlPredictions.schedule,
        mlPredictions: mlPredictions.mlPrediction
      };

      // Generate recommendations (basic version - can be enhanced)
      recommendations = [
        {
          type: 'action',
          priority: 1,
          category: 'ML Recommendation',
          message: `ML model recommends ${mlPredictions.mlPrediction.recommended_irrigation_mm || 0}mm of irrigation`
        }
      ];

    } catch (mlError) {
      console.warn('ML processing failed, using fallback mode:', mlError.message);
      processingMode = 'fallback';
      
      // Fallback: basic schedule generation
      const cropCalendar = require('../cropCalendar');
      const calendarData = getCalendarForCrop(crop_type);
      const sowDate = new Date(sowing_date);
      const harvestDate = new Date(sowDate);
      harvestDate.setDate(harvestDate.getDate() + crop_growth_days_value);

      mlResult = {
        success: true,
        schedule: {
          schedule: calendarData.irrigationSchedule || [],
          harvestDate: harvestDate.toISOString().split('T')[0],
          totalGrowthDays: crop_growth_days_value,
          totalWaterNeeded: calendarData.waterRequirement || 1000,
          mlConfidence: 0.75
        },
        mlPredictions: {
          irrigationNeeded: 1,
          recommended_irrigation_mm: calendarData.waterRequirement || 1000,
          confidence: 0.75
        }
      };
    }

    // Create form document with all CSV fields (using database-friendly names)
    const newCrop = new Form({
      farm_id: finalFarmId,
      region,
      crop_type,
      soil_type,
      soil_moisture_percent: soil_moisture_percent_value,
      soil_pH: soil_pH_value,
      temperature_C: temperature_C_value,
      rainfall_mm: rainfall_mm_value,
      humidity_percent: humidity_percent_value,
      NDVI_index: NDVI_index_value,
      sowing_date: new Date(sowing_date),
      harvest_date: harvest_date ? new Date(harvest_date) : null,
      crop_growth_days: crop_growth_days_value,
      recommended_irrigation_mm: mlResult.mlPredictions?.recommended_irrigation_mm || 0,
      predictedSchedule: mlResult.schedule?.schedule || [],
      mlPredictions: mlResult.mlPredictions,
      recommendations: recommendations,
      status: typeof status !== 'undefined' ? status === 'true' || status === true : true,
      photo: req.file ? {
        data: req.file.buffer,
        contentType: req.file.mimetype
      } : undefined
    });

    await newCrop.save();

    // Generate detailed daily schedule
    let detailedDailySchedule = [];
    if (mlResult.schedule && mlResult.schedule.schedule) {
      mlResult.schedule.schedule.forEach(phase => {
        if (phase.irrigations && Array.isArray(phase.irrigations)) {
          phase.irrigations.forEach(irr => {
            detailedDailySchedule.push({
              date: irr.date,
              phase: irr.phase,
              amount: irr.amount,
              unit: irr.unit || 'mm',
              confidence: irr.confidence || mlResult.schedule.mlConfidence
            });
          });
        }
      });
      detailedDailySchedule.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    res.status(201).json({
      message: 'Crop added successfully and processed with ML',
      success: true,
      processingMode: processingMode,
      data: {
        crop: {
          _id: newCrop._id,
          farm_id: newCrop.farm_id,
          region: newCrop.region,
          crop_type: newCrop.crop_type,
          soil_type: newCrop.soil_type,
          sowing_date: newCrop.sowing_date,
          crop_growth_days: newCrop.crop_growth_days
        },
        irrigationSchedule: mlResult.schedule,
        detailedDailySchedule: detailedDailySchedule,
        mlPredictions: mlResult.mlPredictions,
        irrigationDetails: {
          recommended_irrigation_mm: mlResult.mlPredictions?.recommended_irrigation_mm || 0,
          crop_growth_days: crop_growth_days_value,
          NDVI_index: NDVI_index_value,
          confidence: mlResult.mlPredictions?.confidence || 0.75
        },
        recommendations: recommendations,
        inputCropData: {
          'soil_moisture_%': soil_moisture_percent_value,
          soil_pH: soil_pH_value,
          temperature_C: temperature_C_value,
          rainfall_mm: rainfall_mm_value,
          'humidity_%': humidity_percent_value,
          NDVI_index: NDVI_index_value
        }
      }
    });

  } catch (error) {
    console.error('Error adding crop:', error);
    try {
      console.error('Request body when error occurred:', req.body);
    } catch (e) {
      console.error('Could not log request body');
    }

    // Handle specific MongoDB errors
    if (error && error.code === 11000) {
      const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'field';
      return res.status(400).json({
        message: `A crop with this ${field} already exists. Please use a different ${field}.`,
        error: error.message,
        success: false
      });
    }

    if (error && error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed: ' + messages.join(', '),
        error: error.message,
        success: false
      });
    }

    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      message: 'Failed to add crop',
      error: error.message,
      success: false,
      ...(isDev ? { stack: error.stack } : {})
    });
  }
});

// Get all crops with predictions
router.get('/crops', async (req, res) => {
  try {
    const crops = await Form.find({ crop_type: { $exists: true, $ne: null } })
      .sort({ createdAt: -1 });
    res.json(crops);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch crops', err });
  }
});

// Get crop by ID
router.get('/crops/:id', async (req, res) => {
  try {
    const crop = await Form.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    
    // Get related predictions
    const predictions = await Predict.find({ fieldId: crop.fieldId });
    
    res.json({
      crop: crop,
      predictions: predictions
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch crop', err });
  }
});

// Update crop with new sensor data and recalculate schedule with ML
router.put('/crops/:id', async (req, res) => {
  try {
    const {
      'soil_moisture_%': soil_moisture_percent,
      soil_pH,
      temperature_C,
      rainfall_mm,
      'humidity_%': humidity_percent,
      NDVI_index
    } = req.body;
    
    const crop = await Form.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Update sensor data with CSV field names
    if (soil_moisture_percent !== undefined) crop['soil_moisture_%'] = parseFloat(soil_moisture_percent);
    if (soil_pH !== undefined) crop.soil_pH = parseFloat(soil_pH);
    if (temperature_C !== undefined) crop.temperature_C = parseFloat(temperature_C);
    if (rainfall_mm !== undefined) crop.rainfall_mm = parseFloat(rainfall_mm);
    if (humidity_percent !== undefined) crop['humidity_%'] = parseFloat(humidity_percent);
    if (NDVI_index !== undefined) crop.NDVI_index = parseFloat(NDVI_index);
    
    crop.updatedAt = new Date();

    // Prepare updated crop data for ML reprocessing with exact CSV field names
    const updatedCropData = {
      farm_id: crop.farm_id,
      region: crop.region,
      crop_type: crop.crop_type,
      soil_type: crop.soil_type,
      'soil_moisture_%': soil_moisture_percent !== undefined ? parseFloat(soil_moisture_percent) : crop['soil_moisture_%'],
      soil_pH: soil_pH !== undefined ? parseFloat(soil_pH) : crop.soil_pH,
      temperature_C: temperature_C !== undefined ? parseFloat(temperature_C) : crop.temperature_C,
      rainfall_mm: rainfall_mm !== undefined ? parseFloat(rainfall_mm) : crop.rainfall_mm,
      'humidity_%': humidity_percent !== undefined ? parseFloat(humidity_percent) : crop['humidity_%'],
      NDVI_index: NDVI_index !== undefined ? parseFloat(NDVI_index) : crop.NDVI_index,
      sowing_date: crop.sowing_date,
      crop_growth_days: crop.crop_growth_days
    };

    // Reprocess with ML model using new sensor data
    let mlResult = null;
    let processingMode = 'ml';

    try {
      const mlService = require('../services/mlService');
      const cropCalendar = require('../cropCalendar');
      
      const mlPredictions = await mlService.processCropWithML(
        updatedCropData,
        getCalendarForCrop(crop.crop_type)
      );
      
      mlResult = {
        success: true,
        schedule: mlPredictions.schedule,
        mlPredictions: mlPredictions.mlPrediction
      };

    } catch (mlError) {
      console.warn('ML update failed, using fallback mode:', mlError.message);
      processingMode = 'fallback';
      
      // Use existing schedule
      mlResult = {
        success: false,
        schedule: crop.predictedSchedule,
        mlPredictions: crop.mlPredictions
      };
    }

    // Update crop with new data
    if (mlResult && mlResult.schedule) {
      crop.predictedSchedule = mlResult.schedule.schedule || [];
      crop.harvest_date = new Date(mlResult.schedule.harvestDate);
      crop.mlPredictions = mlResult.mlPredictions;
      crop.recommended_irrigation_mm = mlResult.mlPredictions?.recommended_irrigation_mm || crop.recommended_irrigation_mm;
    }

    await crop.save();

    // Generate detailed daily schedule
    let detailedDailySchedule = [];
    if (mlResult && mlResult.schedule && mlResult.schedule.schedule) {
      mlResult.schedule.schedule.forEach(phase => {
        if (phase.irrigations && Array.isArray(phase.irrigations)) {
          phase.irrigations.forEach(irr => {
            detailedDailySchedule.push({
              date: irr.date,
              phase: irr.phase,
              amount: irr.amount,
              unit: irr.unit || 'mm',
              confidence: irr.confidence || mlResult.schedule.mlConfidence
            });
          });
        }
      });
      detailedDailySchedule.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    res.json({
      message: 'Crop updated successfully with sensor data reprocessing',
      success: true,
      processingMode: processingMode,
      data: {
        crop: {
          _id: crop._id,
          farm_id: crop.farm_id,
          region: crop.region,
          crop_type: crop.crop_type,
          soil_type: crop.soil_type
        },
        updatedSensorData: {
          'soil_moisture_%': updatedCropData['soil_moisture_%'],
          soil_pH: updatedCropData.soil_pH,
          temperature_C: updatedCropData.temperature_C,
          rainfall_mm: updatedCropData.rainfall_mm,
          'humidity_%': updatedCropData['humidity_%'],
          NDVI_index: updatedCropData.NDVI_index
        },
        irrigationSchedule: mlResult?.schedule,
        detailedDailySchedule: detailedDailySchedule,
        mlPredictions: mlResult?.mlPredictions,
        timestamp: new Date()
      }
    });

  } catch (err) {
    console.error('Error updating crop:', err);
    res.status(500).json({ 
      message: 'Failed to update crop', 
      error: err.message,
      success: false 
    });
  }
});

// Get detailed irrigation schedule for a crop
router.get('/crops/:id/schedule', async (req, res) => {
  try {
    const crop = await Form.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Get ML predictions for this crop
    const predictions = await Predict.findOne({ fieldId: crop.fieldId }).sort({ predictedAt: -1 });

    // Generate detailed daily schedule
    const detailedSchedule = [];
    if (crop.predictedSchedule && Array.isArray(crop.predictedSchedule)) {
      crop.predictedSchedule.forEach(phase => {
        if (phase.irrigations && Array.isArray(phase.irrigations)) {
          phase.irrigations.forEach(irrigation => {
            detailedSchedule.push({
              date: irrigation.date,
              phase: phase.phase || irrigation.phase,
              amount: irrigation.amount,
              unit: irrigation.unit || 'mm',
              interval: phase.interval,
              confidence: irrigation.confidence || 0.85
            });
          });
        }
      });
    }

    // Sort by date
    detailedSchedule.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      crop: crop.cropName,
      fieldId: crop.fieldId,
      soilType: crop.soilType,
      region: crop.region,
      sowDate: crop.sowDate,
      estimatedHarvestDate: crop.estimatedHarvestDate,
      growthDays: crop.growthDays,
      currentSensorData: {
        soilMoisture: crop.soilMoisture,
        soilPH: crop.soilPH,
        temperature: crop.temperature,
        avgRainfall: crop.avgRainfall
      },
      irrigationSchedule: crop.predictedSchedule,
      detailedDailySchedule: detailedSchedule,
      mlPredictions: predictions ? predictions.details : null,
      updatedAt: crop.updatedAt
    });
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ 
      message: 'Failed to fetch schedule', 
      error: err.message 
    });
  }
});


module.exports = router;
