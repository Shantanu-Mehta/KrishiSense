const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

/**
 * Call Python ML model to make predictions
 * @param {Object} cropData - Crop and sensor data
 * @returns {Promise<Object>} - ML predictions
 */
const callMLModel = async (cropData) => {
  return new Promise((resolve, reject) => {
    try {
      // Path to Python script
      const pythonScript = path.join(__dirname, '../ml/predict.py');
      
      // Use .venv Python path
      const pythonPath = os.platform() === 'win32' 
        ? path.join(__dirname, '../../.venv/Scripts/python.exe')
        : path.join(__dirname, '../../.venv/bin/python');
      
      // Spawn Python process
      const pythonProcess = spawn(pythonPath, [pythonScript, JSON.stringify(cropData)]);
      
      let output = '';
      let error = '';

      // Collect stdout
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      // Collect stderr
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python error:', error);
          reject(new Error(`Python process exited with code ${code}: ${error}`));
          return;
        }

        try {
          const result = JSON.parse(output);
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error || 'ML prediction failed'));
          }
        } catch (e) {
          console.error('Parse error:', e, 'Output:', output);
          reject(new Error('Failed to parse ML output'));
        }
      });

      // Handle process errors
      pythonProcess.on('error', (err) => {
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Run ML prediction for ESP32 sensor data
 * @param {Object} inputData - Sensor data from ESP32
 * @returns {Promise<Object>} - { should_irrigate: boolean, water_amount: number }
 */
const runMLPrediction = async (inputData) => {
  return new Promise((resolve) => {
    try {
      // Path to Python script
      const pythonScript = path.join(__dirname, '../ml/predict.py');
      
      // Use .venv Python path
      const pythonPath = os.platform() === 'win32' 
        ? path.join(__dirname, '../../.venv/Scripts/python.exe')
        : path.join(__dirname, '../../.venv/bin/python');
      
      // Spawn Python process
      const pythonProcess = spawn(pythonPath, [pythonScript, JSON.stringify(inputData)]);
      
      let output = '';
      let error = '';

      // Collect stdout
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      // Collect stderr
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        try {
          const result = JSON.parse(output.trim());
          resolve({
            should_irrigate: result.should_irrigate || false,
            water_amount: result.water_amount || 0,
            schedule: result.schedule || []
          });
        } catch (e) {
          console.error('Failed to parse ML output:', output, 'Error:', error);
          // Provide fallback values when ML fails
          resolve({ should_irrigate: false, water_amount: 0, schedule: [] });
        }
      });

      // Handle process errors
      pythonProcess.on('error', (err) => {
        console.error('Failed to spawn Python process:', err.message);
        resolve({ should_irrigate: false, water_amount: 0, schedule: [] });
      });

    } catch (error) {
      console.error('Error in runMLPrediction:', error);
      resolve({ should_irrigate: false, water_amount: 0, schedule: [] });
    }
  });
};

/**
 * Generate irrigation schedule based on ML predictions and crop calendar
 * @param {Object} mlPrediction - ML model predictions
 * @param {Object} cropData - Crop information with CSV header names
 * @param {Object} cropCalendar - Crop details from calendar
 * @returns {Object} - Detailed irrigation schedule
 */
const generateScheduleFromML = (mlPrediction, cropData, cropCalendar) => {
  try {
    // Use recommended_irrigation_mm from ML prediction or fallback to cropCalendar
    const waterAmount = mlPrediction.predictions.recommended_irrigation_mm || cropCalendar.waterRequirement || 500;
    const confidence = mlPrediction.predictions.confidence || 0.85;
    const sowDate = new Date(cropData.sowing_date);
    const growthDays = cropData.crop_growth_days || cropCalendar.growthDays || 120;

    // Generate phase-based schedule
    const schedule = [];
    const phases = cropCalendar.irrigationSchedule || [];

    phases.forEach((phase, index) => {
      const phaseStart = new Date(sowDate);
      phaseStart.setDate(phaseStart.getDate() + (phases.slice(0, index).reduce((sum, p) => sum + p.days, 0)));

      const irrigationDays = [];
      const phaseWaterPerDay = (waterAmount / growthDays) * (phase.days / growthDays);

      for (let day = 0; day < phase.days; day += phase.interval) {
        const irrigationDate = new Date(phaseStart);
        irrigationDate.setDate(irrigationDate.getDate() + day);

        irrigationDays.push({
          date: irrigationDate.toISOString().split('T')[0],
          dayOfPhase: day,
          amount: parseFloat((phaseWaterPerDay * confidence).toFixed(2)),
          unit: 'mm',
          phase: phase.phase,
          confidence: confidence
        });
      }

      schedule.push({
        phase: phase.phase,
        startDate: phaseStart.toISOString().split('T')[0],
        duration: phase.days,
        interval: phase.interval,
        irrigations: irrigationDays,
        totalWaterForPhase: parseFloat((phaseWaterPerDay * phase.days).toFixed(2))
      });
    });

    // Calculate harvest date
    const harvestDate = new Date(sowDate);
    harvestDate.setDate(harvestDate.getDate() + growthDays);

    return {
      schedule: schedule,
      harvestDate: harvestDate.toISOString().split('T')[0],
      totalGrowthDays: growthDays,
      totalWaterNeeded: parseFloat(waterAmount.toFixed(2)),
      mlConfidence: parseFloat(confidence.toFixed(2)),
      mlPredictionDetails: {
        irrigationNeeded: mlPrediction.predictions.irrigationNeeded,
        recommended_irrigation_mm: mlPrediction.predictions.recommended_irrigation_mm,
        classification: mlPrediction.predictions.classification
      }
    };
  } catch (error) {
    console.error('Error generating schedule from ML:', error);
    return null;
  }
};

/**
 * Process crop data with ML model and generate schedule
 * @param {Object} cropData - Complete crop information
 * @param {Object} cropCalendar - Crop calendar details
 * @returns {Promise<Object>} - Complete prediction and schedule
 */
const processCropWithML = async (cropData, cropCalendar) => {
  try {
    // Call ML model
    const mlPrediction = await callMLModel(cropData);

    // Generate detailed schedule based on ML predictions
    const schedule = generateScheduleFromML(mlPrediction, cropData, cropCalendar);

    if (!schedule) {
      throw new Error('Failed to generate schedule from ML predictions');
    }

    return {
      mlPrediction: mlPrediction.predictions,
      schedule: schedule,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error in ML processing:', error);
    throw error;
  }
};

/**
 * Optimize irrigation schedule based on current conditions
 * @param {Object} currentSchedule - Current irrigation schedule
 * @param {Object} sensorData - Current sensor readings using CSV header names
 * @returns {Object} - Optimized schedule
 */
const optimizeSchedule = (currentSchedule, sensorData) => {
  try {
    const optimized = JSON.parse(JSON.stringify(currentSchedule));
    
    // Adjust based on soil moisture using CSV field name
    const soilMoisture = sensorData['soil_moisture_%'] || 50;
    if (soilMoisture > 70) {
      // Skip next irrigation if soil is already wet
      optimized.schedule.forEach(phase => {
        phase.irrigations = phase.irrigations.filter((_, idx) => idx % 2 === 0);
      });
    } else if (soilMoisture < 30) {
      // Increase irrigation frequency if soil is dry
      optimized.schedule.forEach(phase => {
        phase.interval = Math.max(1, phase.interval - 1);
      });
    }

    // Adjust based on rainfall using CSV field name
    const rainfall = sensorData.rainfall_mm || 0;
    if (rainfall > 50) {
      // Reduce water amount if there's significant rainfall
      const rainfallFactor = Math.max(0.7, 1 - (rainfall / 200));
      optimized.schedule.forEach(phase => {
        phase.irrigations.forEach(irr => {
          irr.amount = parseFloat((irr.amount * rainfallFactor).toFixed(2));
        });
      });
    }

    return optimized;
  } catch (error) {
    console.error('Error optimizing schedule:', error);
    return currentSchedule;
  }
};

module.exports = {
  callMLModel,
  generateScheduleFromML,
  processCropWithML,
  optimizeSchedule,
  runMLPrediction
};
