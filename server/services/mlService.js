const { spawn } = require('child_process');
const path = require('path');
const os = require('os');


const callMLModel = async (cropData) => {
  return new Promise((resolve, reject) => {
    try {
      
      const pythonScript = path.join(__dirname, '../ml/predict.py');
      
      
      const pythonPath = os.platform() === 'win32' 
        ? path.join(__dirname, '../../.venv/Scripts/python.exe')
        : path.join(__dirname, '../../.venv/bin/python');
      
      
      const pythonProcess = spawn(pythonPath, [pythonScript, JSON.stringify(cropData)]);
      
      let output = '';
      let error = '';

      // Collect stdout
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      
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

      
      pythonProcess.on('error', (err) => {
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
      });

    } catch (error) {
      reject(error);
    }
  });
};


const runMLPrediction = async (inputData) => {
  return new Promise((resolve) => {
    try {
      
      const pythonScript = path.join(__dirname, '../ml/predict.py');
      
      
      const pythonPath = os.platform() === 'win32' 
        ? path.join(__dirname, '../../.venv/Scripts/python.exe')
        : path.join(__dirname, '../../.venv/bin/python');
      
      
      const pythonProcess = spawn(pythonPath, [pythonScript, JSON.stringify(inputData)]);
      
      let output = '';
      let error = '';

      // Collect stdout
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      
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
          
          resolve({ should_irrigate: false, water_amount: 0, schedule: [] });
        }
      });

      
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


const generateScheduleFromML = (mlPrediction, cropData, cropCalendar) => {
  try {
    
    const waterAmount = mlPrediction.predictions.recommended_irrigation_mm || cropCalendar.waterRequirement || 500;
    const confidence = mlPrediction.predictions.confidence || 0.85;
    const sowDate = new Date(cropData.sowing_date);
    const growthDays = cropData.crop_growth_days || cropCalendar.growthDays || 120;

    
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


const processCropWithML = async (cropData, cropCalendar) => {
  try {
    
    const mlPrediction = await callMLModel(cropData);

    
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


const optimizeSchedule = (currentSchedule, sensorData) => {
  try {
    const optimized = JSON.parse(JSON.stringify(currentSchedule));
    
    
    const soilMoisture = sensorData['soil_moisture_%'] || 50;
    if (soilMoisture > 70) {
      
      optimized.schedule.forEach(phase => {
        phase.irrigations = phase.irrigations.filter((_, idx) => idx % 2 === 0);
      });
    } else if (soilMoisture < 30) {
      
      optimized.schedule.forEach(phase => {
        phase.interval = Math.max(1, phase.interval - 1);
      });
    }

    
    const rainfall = sensorData.rainfall_mm || 0;
    if (rainfall > 50) {
      
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
