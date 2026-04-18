/**
 * ML Controller - Handles ML model predictions and responses
 * Processes data from AddCrop.jsx and manages ML prediction pipeline
 */

const mlService = require('./mlService');
const cropService = require('./cropService');
const cropCalendar = require('../cropCalendar');

/**
 * Process crop data from AddCrop form and generate comprehensive predictions
 */
const processCropSubmission = async (formData) => {
  try {
    const {
      cropName,
      soilType,
      sowDate,
      region,
      soilMoisture = 50,
      soilPH = 7.0,
      temperature = 25,
      avgRainfall = 100
    } = formData;

    // Validate crop exists in calendar
    if (!cropCalendar[cropName]) {
      throw new Error(`Invalid crop: ${cropName}`);
    }

    // Prepare crop data for ML processing
    const cropData = {
      cropName,
      soilType,
      sowDate,
      region,
      soilMoisture,
      soilPH,
      temperature,
      avgRainfall,
      fieldId: `${cropName}-${Date.now()}`
    };

    // Get crop calendar details
    const crop = cropCalendar[cropName];

    // Call ML service to process crop data
    const mlResult = await mlService.processCropWithML(cropData, crop);

    // Optimize schedule based on current conditions
    const optimizedSchedule = mlService.optimizeSchedule(
      mlResult.schedule,
      { soilMoisture, avgRainfall }
    );

    return {
      success: true,
      fieldId: cropData.fieldId,
      cropData: {
        name: cropName,
        soilType,
        sowDate,
        region
      },
      inputSensorData: {
        soilMoisture,
        soilPH,
        temperature,
        avgRainfall
      },
      mlPredictions: mlResult.mlPrediction,
      schedule: optimizedSchedule,
      irrigationDetails: {
        totalWaterNeeded: optimizedSchedule.totalWaterNeeded,
        estimatedHarvestDate: optimizedSchedule.harvestDate,
        growthDays: optimizedSchedule.totalGrowthDays,
        confidence: optimizedSchedule.mlConfidence
      },
      recommendations: generateRecommendations(cropData, mlResult)
    };
  } catch (error) {
    console.error('Error processing crop submission:', error);
    throw error;
  }
};

/**
 * Generate farming recommendations based on ML predictions
 */
const generateRecommendations = (cropData, mlResult) => {
  const recommendations = [];

  const { soilMoisture, soilPH, temperature, avgRainfall } = cropData;
  const { irrigationNeeded } = mlResult.mlPrediction;

  // Soil moisture recommendations
  if (soilMoisture < 30) {
    recommendations.push({
      type: 'urgent',
      category: 'Soil Moisture',
      message: 'Soil is too dry. Irrigate immediately.',
      priority: 1
    });
  } else if (soilMoisture > 80) {
    recommendations.push({
      type: 'warning',
      category: 'Soil Moisture',
      message: 'Soil has excessive moisture. Reduce irrigation or improve drainage.',
      priority: 2
    });
  }

  // Soil pH recommendations
  if (soilPH < 6.0) {
    recommendations.push({
      type: 'action',
      category: 'Soil pH',
      message: 'Soil is acidic. Consider adding lime to increase pH.',
      priority: 2
    });
  } else if (soilPH > 8.0) {
    recommendations.push({
      type: 'action',
      category: 'Soil pH',
      message: 'Soil is alkaline. Consider adding sulfur to decrease pH.',
      priority: 2
    });
  }

  // Temperature recommendations
  if (temperature > 35) {
    recommendations.push({
      type: 'warning',
      category: 'Temperature',
      message: 'Temperature is high. Increase irrigation frequency to prevent crop stress.',
      priority: 2
    });
  } else if (temperature < 15) {
    recommendations.push({
      type: 'info',
      category: 'Temperature',
      message: 'Temperature is low. Monitor crop growth closely.',
      priority: 3
    });
  }

  // Rainfall recommendations
  if (avgRainfall > 150) {
    recommendations.push({
      type: 'info',
      category: 'Rainfall',
      message: 'High rainfall expected. Reduce scheduled irrigation.',
      priority: 2
    });
  } else if (avgRainfall < 20) {
    recommendations.push({
      type: 'warning',
      category: 'Rainfall',
      message: 'Low rainfall expected. Increase manual irrigation.',
      priority: 2
    });
  }

  // ML-based recommendations
  if (irrigationNeeded) {
    recommendations.push({
      type: 'action',
      category: 'ML Prediction',
      message: 'ML model recommends starting irrigation schedule.',
      priority: 1
    });
  }

  // Sort by priority
  return recommendations.sort((a, b) => a.priority - b.priority);
};

/**
 * Update predictions when sensor data changes
 */
const updatePredictionsWithSensorData = async (fieldId, cropName, newSensorData) => {
  try {
    const crop = cropCalendar[cropName];
    if (!crop) {
      throw new Error(`Crop not found: ${cropName}`);
    }

    const cropData = {
      cropName,
      fieldId,
      ...newSensorData
    };

    // Reprocess with new sensor data
    const mlResult = await mlService.processCropWithML(cropData, crop);

    return {
      success: true,
      fieldId,
      newPredictions: mlResult.mlPrediction,
      updatedSchedule: mlResult.schedule,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error updating predictions:', error);
    throw error;
  }
};

/**
 * Get irrigation schedule with daily breakdown
 */
const getDetailedSchedule = (schedule) => {
  try {
    const detailedSchedule = [];

    schedule.schedule.forEach(phase => {
      phase.irrigations.forEach(irrigation => {
        detailedSchedule.push({
          date: irrigation.date,
          phase: irrigation.phase,
          amount: irrigation.amount,
          unit: irrigation.unit,
          confidence: irrigation.confidence,
          dayOfCycle: irrigation.dayOfPhase
        });
      });
    });

    // Sort by date
    detailedSchedule.sort((a, b) => new Date(a.date) - new Date(b.date));

    return detailedSchedule;
  } catch (error) {
    console.error('Error generating detailed schedule:', error);
    return [];
  }
};

/**
 * Validate crop data before processing
 */
const validateCropData = (cropData) => {
  const errors = [];

  if (!cropData.cropName) errors.push('Crop name is required');
  if (!cropCalendar[cropData.cropName]) errors.push('Invalid crop name');
  if (!cropData.soilType) errors.push('Soil type is required');
  if (!cropData.sowDate) errors.push('Sow date is required');
  if (!cropData.region) errors.push('Region is required');

  if (cropData.soilPH && (cropData.soilPH < 4 || cropData.soilPH > 9)) {
    errors.push('Soil pH must be between 4 and 9');
  }

  if (cropData.soilMoisture && (cropData.soilMoisture < 0 || cropData.soilMoisture > 100)) {
    errors.push('Soil moisture must be between 0 and 100%');
  }

  if (cropData.temperature && (cropData.temperature < -10 || cropData.temperature > 60)) {
    errors.push('Temperature must be between -10 and 60°C');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  processCropSubmission,
  generateRecommendations,
  updatePredictionsWithSensorData,
  getDetailedSchedule,
  validateCropData
};
