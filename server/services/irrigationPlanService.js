/**
 * Irrigation Plan Service
 * Builds detailed irrigation plans from ML predictions
 */

/**
 * Build irrigation plan from merged data, ML result, and validation result
 * @param {Object} mergedData - Merged user input and sensor data
 * @param {Object} mlResult - ML model result {should_irrigate, water_amount}
 * @param {Object} validationResult - Validation checks result
 * @returns {Object} - Complete irrigation plan with schedule and recommendations
 */
function buildIrrigationPlan(mergedData, mlResult, validationResult) {
  const {
    crop,
    soilType,
    sowingDate,
    fieldArea,
    city,
    state
  } = mergedData;

  // Generate 7-day irrigation schedule
  const schedule = generateIrrigationSchedule(mlResult, sowingDate, fieldArea);

  // Generate crop-specific recommendations
  const recommendations = generateRecommendations(crop, soilType, mlResult, validationResult, fieldArea);

  return {
    schedule,
    recommendations
  };
}

/**
 * Generate 7-day irrigation schedule based on ML prediction
 * @param {Object} mlResult - ML prediction result containing full schedule
 * @param {string} sowingDate - Sowing date
 * @param {number} fieldArea - Field area in acres
 * @returns {Array} - 7-day schedule
 */
function generateIrrigationSchedule(mlResult, sowingDate, fieldArea) {
  const schedule = [];
  const startDate = new Date(sowingDate || new Date());

  // Use the mlResult.schedule array if available, otherwise fallback to replicating day 1
  for (let day = 1; day <= 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day - 1);
    
    // Find matching day in mlResult schedule, or fallback to general mlResult
    const dayPrediction = (mlResult.schedule && mlResult.schedule[day - 1]) 
      ? mlResult.schedule[day - 1] 
      : { should_irrigate: mlResult.should_irrigate, water_amount: mlResult.water_amount };

    // 1 mm over 1 acre = 4046.86 Liters
    const totalWaterAmount = dayPrediction.water_amount * fieldArea * 4046.86;

    const daySchedule = {
      day: day,
      date: currentDate.toISOString().split('T')[0],
      should_irrigate: dayPrediction.should_irrigate,
      water_amount: totalWaterAmount,
      simulated_moisture: dayPrediction.simulated_moisture || null,
      sessions: []
    };

    // If irrigation is needed, create sessions
    if (dayPrediction.should_irrigate && totalWaterAmount > 0) {
      // Determine number of sessions based on water amount
      let sessionsCount;
      if (totalWaterAmount <= 10) {
        sessionsCount = 1;
      } else if (totalWaterAmount <= 20) {
        sessionsCount = 2;
      } else {
        sessionsCount = 3;
      }

      const sessionTimes = getSessionTimes(sessionsCount);
      const waterPerSession = Math.ceil(totalWaterAmount / sessionsCount);
      
      // Typical 5V mini submersible pump (0.5cm nozzle) rate is ~2 Liters per minute
      const PUMP_CAPACITY_LPM = 2.0;

      sessionTimes.forEach((time, index) => {
        // Calculate duration in minutes
        const durationMinutes = Math.ceil(waterPerSession / PUMP_CAPACITY_LPM);
        
        // Calculate end time
        const [hours, minutes] = time.split(':').map(Number);
        const startTimeObj = new Date();
        startTimeObj.setHours(hours, minutes, 0, 0);
        startTimeObj.setMinutes(startTimeObj.getMinutes() + durationMinutes);
        
        const endHours = String(startTimeObj.getHours()).padStart(2, '0');
        const endMinutes = String(startTimeObj.getMinutes()).padStart(2, '0');
        const endTime = `${endHours}:${endMinutes}`;

        daySchedule.sessions.push({
          session_number: index + 1,
          time: time,
          end_time: endTime,
          duration_minutes: durationMinutes,
          water_amount_liters: waterPerSession
        });
      });
    }

    schedule.push(daySchedule);
  }

  return schedule;
}

/**
 * Generate crop-specific recommendations
 * @param {string} crop - Crop type
 * @param {string} soilType - Soil type
 * @param {Object} mlResult - ML prediction result
 * @param {Object} validationResult - Validation result
 * @param {number} fieldArea - Field area in acres
 * @returns {Array<string>} - Recommendations array
 */
function generateRecommendations(crop, soilType, mlResult, validationResult, fieldArea) {
  const recommendations = [];

  // Basic irrigation recommendations
  if (mlResult.should_irrigate) {
    const totalWater = mlResult.water_amount * fieldArea;
    recommendations.push(`Irrigate with ${totalWater.toFixed(1)} liters per day for optimal ${crop} growth`);
    recommendations.push("Water early morning (6 AM) or evening (6 PM) to reduce evaporation");
  } else {
    recommendations.push("No irrigation needed currently - soil moisture is adequate");
    recommendations.push("Monitor soil moisture levels and check again in 24 hours");
  }

  // Crop-specific recommendations
  const cropRecommendations = getCropSpecificRecommendations(crop);
  recommendations.push(...cropRecommendations);

  // Soil-specific recommendations
  const soilRecommendations = getSoilSpecificRecommendations(soilType);
  recommendations.push(...soilRecommendations);

  // Add validation-based recommendations
  if (validationResult.checks) {
    if (validationResult.checks.season && validationResult.checks.season.passed) {
      recommendations.push(`Current season is suitable for ${crop} cultivation`);
    }
    if (validationResult.checks.soil && validationResult.checks.soil.passed) {
      recommendations.push(`${soilType} soil provides good conditions for ${crop}`);
    }
  }

  return recommendations;
}

/**
 * Get crop-specific recommendations
 * @param {string} crop - Crop type
 * @returns {Array<string>} - Crop recommendations
 */
function getCropSpecificRecommendations(crop) {
  const recommendations = {
    wheat: [
      "Apply nitrogen fertilizer during tillering stage (15-20 days after sowing)",
      "Monitor for rust disease during humid conditions",
      "Ensure proper drainage to prevent waterlogging"
    ],
    rice: [
      "Maintain standing water during early growth stages (first 30 days)",
      "Apply phosphorus fertilizer at transplanting",
      "Monitor for pest attacks during flowering stage"
    ],
    cotton: [
      "Apply potassium fertilizer for better fiber quality",
      "Monitor for bollworm infestation regularly",
      "Avoid water stress during boll formation stage"
    ],
    sugarcane: [
      "Apply nitrogen in 3-4 splits throughout the growth period",
      "Monitor for red rot disease symptoms",
      "Ensure adequate drainage to prevent waterlogging"
    ],
    maize: [
      "Apply zinc fertilizer if deficiency symptoms appear",
      "Monitor for corn borer during tasseling stage",
      "Avoid water stress during pollination period"
    ],
    vegetables: [
      "Use mulch to maintain soil moisture and reduce evaporation",
      "Apply balanced NPK fertilizer every 2-3 weeks",
      "Monitor for fungal diseases in high humidity conditions"
    ],
    fruits: [
      "Apply organic matter for better fruit quality and yield",
      "Avoid overhead watering to prevent fungal diseases",
      "Monitor soil pH regularly (maintain 6.0-7.0)"
    ]
  };

  return recommendations[crop.toLowerCase()] || [
    "Apply balanced fertilizer based on soil test results",
    "Monitor for pests and diseases regularly",
    "Maintain proper field sanitation"
  ];
}

/**
 * Get soil-specific recommendations
 * @param {string} soilType - Soil type
 * @returns {Array<string>} - Soil recommendations
 */
function getSoilSpecificRecommendations(soilType) {
  const recommendations = {
    sandy: [
      "Irrigate more frequently as sandy soil drains quickly",
      "Apply organic matter to improve water retention",
      "Use mulch to reduce evaporation from soil surface"
    ],
    loamy: [
      "Loamy soil has good water retention capacity",
      "Monitor soil moisture regularly",
      "Apply balanced fertilizers for optimal crop growth"
    ],
    clay: [
      "Clay soil retains water well but may cause waterlogging",
      "Ensure proper drainage to prevent root rot",
      "Avoid over-irrigation to prevent soil compaction"
    ],
    black: [
      "Black soil has excellent water retention",
      "Monitor for soil cracking during dry periods",
      "Apply gypsum if soil becomes too sticky"
    ],
    red: [
      "Red soil may need additional organic matter",
      "Monitor pH levels and adjust with lime if acidic",
      "Apply phosphorus fertilizer for better root development"
    ]
  };

  return recommendations[soilType.toLowerCase()] || [
    "Test soil pH and nutrient levels regularly",
    "Apply organic matter to improve soil structure",
    "Monitor soil moisture and adjust irrigation accordingly"
  ];
}

/**
 * Get session times based on number of sessions per day
 * @param {number} sessionsCount - Number of sessions
 * @returns {Array<string>} - Session times
 */
function getSessionTimes(sessionsCount) {
  switch (sessionsCount) {
    case 1:
      return ["06:00"];
    case 2:
      return ["06:00", "18:00"];
    case 3:
      return ["06:00", "12:00", "18:00"];
    default:
      return ["06:00"];
  }
}

module.exports = {
  buildIrrigationPlan,
  generateIrrigationSchedule,
  generateRecommendations
};