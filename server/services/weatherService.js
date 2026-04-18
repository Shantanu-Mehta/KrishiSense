const axios = require('axios');

// Function to fetch weather data from OpenWeatherMap API
const getWeatherData = async (region, latitude, longitude) => {
  try {
    // Using Open-Meteo API (free, no API key required)
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum&timezone=auto`;
    
    const response = await axios.get(apiUrl);
    
    if (response.data && response.data.daily) {
      const dailyData = response.data.daily;
      // Calculate average rainfall from daily data
      const avgRainfall = dailyData.precipitation_sum.reduce((a, b) => a + b, 0) / dailyData.precipitation_sum.length;
      return {
        avgRainfall: avgRainfall || 0,
        region: region,
        estimatedMonthlyRainfall: avgRainfall * 30
      };
    }
  } catch (error) {
    console.error('Weather API Error:', error);
    return { avgRainfall: 0, region, error: 'Unable to fetch weather data' };
  }
};

// Region to coordinates mapping (Indian regions)
const regionCoordinates = {
  'North India': { lat: 28.6139, lng: 77.2090 }, // Delhi
  'South India': { lat: 13.0827, lng: 80.2707 }, // Chennai
  'East India': { lat: 22.5726, lng: 88.3639 }, // Kolkata
  'West India': { lat: 19.0760, lng: 72.8777 }, // Mumbai
  'Central India': { lat: 23.1815, lng: 79.9864 }, // Bhopal
  'Punjab': { lat: 31.5497, lng: 74.3436 },
  'Karnataka': { lat: 15.3173, lng: 75.7139 },
  'Maharashtra': { lat: 19.7515, lng: 75.7139 },
  'Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
  'Tamil Nadu': { lat: 11.8568, lng: 79.8711 }
};

const getCoordinatesForRegion = (region) => {
  return regionCoordinates[region] || { lat: 20.5937, lng: 78.9629 }; // Default to India center
};

module.exports = {
  getWeatherData,
  getCoordinatesForRegion,
  regionCoordinates
};
