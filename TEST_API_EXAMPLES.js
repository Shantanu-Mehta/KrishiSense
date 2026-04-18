
const addCropExample = async () => {
  try {
    const formData = new FormData();
    formData.append('cropName', 'Rice');
    formData.append('soilType', 'loamy');
    formData.append('sowDate', '2024-02-15');
    formData.append('region', 'North India');
    

    const response = await fetch('http://localhost:5000/api/data/crops', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log('Crop Added:', data);
    return data.data.crop._id;
  } catch (error) {
    console.error('Error adding crop:', error);
  }
};


const getAllCropsExample = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/data/crops');
    const crops = await response.json();
    console.log('All Crops:', crops);
  } catch (error) {
    console.error('Error fetching crops:', error);
  }
};

const getCropDetailsExample = async (cropId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/data/crops/${cropId}`);
    const data = await response.json();
    console.log('Crop Details:', data);
    console.log('Crop:', data.crop);
    console.log('Predictions:', data.predictions);
  } catch (error) {
    console.error('Error fetching crop details:', error);
  }
};


const getScheduleExample = async (cropId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/data/crops/${cropId}/schedule`);
    const scheduleData = await response.json();
    console.log('Irrigation Schedule:');
    console.log(`Crop: ${scheduleData.crop}`);
    console.log(`Field ID: ${scheduleData.fieldId}`);
    console.log(`Growth Days: ${scheduleData.growthDays}`);
    console.log(`Estimated Harvest: ${scheduleData.estimatedHarvestDate}`);
    console.log('Phases:');
    scheduleData.schedule.forEach(phase => {
      console.log(`  - ${phase.phase}: ${phase.duration} days, every ${phase.interval} days`);
      phase.irrigations.forEach(irrigation => {
        console.log(`    ${irrigation.date}: ${irrigation.amount.toFixed(2)}mm`);
      });
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
  }
};

const updateSensorDataExample = async (cropId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/data/crops/${cropId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        soilMoisture: 75,
        soilPH: 7.2,
        temperature: 28
      })
    });

    const data = await response.json();
    console.log('Crop Updated:', data.message);
    console.log('New Sensor Data:', {
      soilMoisture: data.data.soilMoisture,
      soilPH: data.data.soilPH,
      temperature: data.data.temperature
    });
    console.log('New Prediction Generated:', data.newPrediction);
  } catch (error) {
    console.error('Error updating sensor data:', error);
  }
};


const runFullTestWorkflow = async () => {
  console.log('=== Starting Full Test Workflow ===');
  
  
  console.log('\n1. Adding new crop...');
  const cropId = await addCropExample();
  if (!cropId) {
    console.error('Failed to add crop');
    return;
  }

  
  await new Promise(resolve => setTimeout(resolve, 1000));

 
  console.log('\n2. Fetching all crops...');
  await getAllCropsExample();

  
  console.log('\n3. Fetching crop details...');
  await getCropDetailsExample(cropId);

  console.log('\n4. Fetching irrigation schedule...');
  await getScheduleExample(cropId);

 
  console.log('\n5. Updating sensor data...');
  await updateSensorDataExample(cropId);

  
  console.log('\n6. Fetching updated schedule...');
  await getScheduleExample(cropId);

  console.log('\n=== Test Workflow Complete ===');
};


module.exports = {
  addCropExample,
  getAllCropsExample,
  getCropDetailsExample,
  getScheduleExample,
  updateSensorDataExample,
  runFullTestWorkflow
};


