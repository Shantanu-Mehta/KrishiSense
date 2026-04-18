const mongoose = require('mongoose');
const SensorData = require('../models/sensor_data_raw');
const Predict = require('../models/predict');
const cropCalendar = require('../cropCalendar');
const mlService = require('./mlService');

// Function to fetch latest sensor data
const getLatestSensorData = async (fieldId) => {
  try {
    const sensorTypes = ['soil_moisture', 'soil_ph', 'temperature'];
    const sensorData = {};

    for (const sensorType of sensorTypes) {
      const data = await SensorData.findOne({ 
        fieldId, 
        sensorType 
      }).sort({ timestamp: -1 });
      
      if (data) {
        sensorData[sensorType] = data.value;
      } else {
        sensorData[sensorType] = null;
      }
    }

    return sensorData;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return { soil_moisture: null, soil_ph: null, temperature: null };
  }
};

// Function to generate irrigation schedule based on crop and environmental data
const generateIrrigationSchedule = (cropName, sensorData, weatherData, sowDate) => {
  try {
    const crop = cropCalendar[cropName];
    if (!crop) return null;

    const schedule = [];
    const startDate = new Date(sowDate);
    const soilMoisture = sensorData.soil_moisture || 50;
    const avgRainfall = weatherData.avgRainfall || 0;

    // Adjust irrigation based on rainfall
    let rainfallFactor = avgRainfall > 100 ? 0.7 : avgRainfall > 50 ? 0.85 : 1;

    crop.irrigationSchedule.forEach((phase, index) => {
      const phaseStart = new Date(startDate);
      phaseStart.setDate(phaseStart.getDate() + phase.days * index);
      
      const irrigationDays = [];
      for (let day = 0; day < phase.days; day += phase.interval) {
        const irrigationDate = new Date(phaseStart);
        irrigationDate.setDate(irrigationDate.getDate() + day);
        
        irrigationDays.push({
          date: irrigationDate,
          amount: (crop.waterRequirement / crop.growthDays) * rainfallFactor,
          phase: phase.phase
        });
      }

      schedule.push({
        phase: phase.phase,
        startDate: phaseStart,
        duration: phase.days,
        irrigations: irrigationDays,
        interval: phase.interval
      });
    });

    const harvestDate = new Date(startDate);
    harvestDate.setDate(harvestDate.getDate() + crop.growthDays);

    return {
      schedule: schedule,
      harvestDate: harvestDate,
      totalGrowthDays: crop.growthDays,
      estimatedWaterNeeded: crop.waterRequirement * rainfallFactor,
      rainfallAdjustmentFactor: rainfallFactor
    };
  } catch (error) {
    console.error('Error generating irrigation schedule:', error);
    return null;
  }
};

// Function to send data to ML model for prediction
const sendToMLModel = async (cropData) => {
  try {
    // Get crop calendar info
    const crop = cropCalendar[cropData.cropName];
    if (!crop) {
      console.warn(`Crop ${cropData.cropName} not found in calendar`);
      return null;
    }

    // Process with ML model
    const mlResult = await mlService.processCropWithML(cropData, crop);

    // Create prediction document
    const prediction = {
      fieldId: cropData.fieldId,
      predictedAt: new Date(),
      predictionType: 'irrigation_schedule_ml',
      value: mlResult.schedule,
      details: {
        crop: cropData.cropName,
        soilType: cropData.soilType,
        region: cropData.region,
        harvestDate: mlResult.schedule.harvestDate,
        confidence: mlResult.schedule.mlConfidence,
        mlPredictions: mlResult.mlPrediction,
        environmentalFactors: {
          soilMoisture: cropData.soilMoisture,
          soilPH: cropData.soilPH,
          temperature: cropData.temperature,
          avgRainfall: cropData.avgRainfall
        },
        totalWaterNeeded: mlResult.schedule.totalWaterNeeded
      }
    };

    // Save to database
    const savedPrediction = new Predict(prediction);
    await savedPrediction.save();

    return {
      prediction: savedPrediction,
      schedule: mlResult.schedule,
      mlData: mlResult.mlPrediction
    };

  } catch (error) {
    console.error('Error processing with ML model:', error);
    // Fallback to schedule-based prediction if ML fails
    return createFallbackPrediction(cropData);
  }
};

// Fallback function if ML model fails
const createFallbackPrediction = async (cropData) => {
  try {
    const crop = cropCalendar[cropData.cropName];
    const schedule = generateIrrigationSchedule(
      cropData.cropName,
      {
        soil_moisture: cropData.soilMoisture,
        soil_ph: cropData.soilPH,
        temperature: cropData.temperature
      },
      { avgRainfall: cropData.avgRainfall },
      cropData.sowDate
    );

    const prediction = {
      fieldId: cropData.fieldId,
      predictedAt: new Date(),
      predictionType: 'irrigation_schedule_fallback',
      value: schedule.schedule,
      details: {
        crop: cropData.cropName,
        soilType: cropData.soilType,
        harvestDate: schedule.harvestDate,
        confidence: 0.75,
        note: 'Fallback prediction - ML model unavailable',
        environmentalFactors: {
          soilMoisture: cropData.soilMoisture,
          soilPH: cropData.soilPH,
          temperature: cropData.temperature,
          avgRainfall: cropData.avgRainfall
        }
      }
    };

    const savedPrediction = new Predict(prediction);
    await savedPrediction.save();

    return { prediction: savedPrediction, schedule: schedule };
  } catch (error) {
    console.error('Error creating fallback prediction:', error);
    return null;
  }
};

module.exports = {
  getLatestSensorData,
  generateIrrigationSchedule,
  sendToMLModel,
  createFallbackPrediction
};
