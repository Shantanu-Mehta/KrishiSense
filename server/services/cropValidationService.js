/**
 * Crop Validation Service
 * Performs intermediate logic checks before calling ML model
 */

const CROP_SEASON_COMPATIBILITY = {
  wheat: ["Rabi"],
  rice: ["Kharif"],
  cotton: ["Kharif"],
  sugarcane: ["Kharif", "Rabi"],
  maize: ["Kharif", "Zaid"],
  vegetables: ["Rabi", "Zaid"],
  fruits: ["Kharif", "Rabi", "Zaid"]
};

const SOIL_CROP_COMPATIBILITY = {
  wheat: ["loamy", "clay", "black"],
  rice: ["clay", "loamy"],
  cotton: ["black", "loamy", "red"],
  sugarcane: ["loamy", "clay"],
  maize: ["loamy", "sandy", "red"],
  vegetables: ["loamy", "sandy", "red"],
  fruits: ["loamy", "red", "black"]
};

/**
 * Detect current season based on current date
 * @returns {string} - "Kharif", "Rabi", or "Zaid"
 */
function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12

  if (month >= 6 && month <= 10) return "Kharif"; // June-October
  if (month >= 11 || month <= 3) return "Rabi"; // November-March
  return "Zaid"; // April-May
}

/**
 * Validate crop suitability for current conditions
 * @param {Object} cropData - Crop and environmental data
 * @returns {Object} - Validation result
 */
function validateCropSuitability(cropData) {
  const {
    crop_type,
    soil_type,
    temperature,
    soil_moisture,
    season_override
  } = cropData;

  const checks = {
    season: "❌",
    soil: "❌",
    temperature: "❌",
    moisture: "❌"
  };

  const warnings = [];
  let failedCheck = null;
  let reason = null;

  // 1. Season Check
  const currentSeason = season_override || getCurrentSeason();
  const compatibleSeasons = CROP_SEASON_COMPATIBILITY[crop_type] || [];

  if (compatibleSeasons.includes(currentSeason)) {
    checks.season = "✅";
  } else {
    failedCheck = "season";
    reason = `${crop_type.charAt(0).toUpperCase() + crop_type.slice(1)} is a ${compatibleSeasons.join("/")} crop but current season is ${currentSeason}. Best sowing months are ${getSeasonMonths(compatibleSeasons[0])}.`;
  }

  // 2. Soil Compatibility Check
  const compatibleSoils = SOIL_CROP_COMPATIBILITY[crop_type] || [];

  if (compatibleSoils.includes(soil_type)) {
    checks.soil = "✅";
  } else {
    if (!failedCheck) failedCheck = "soil";
    if (!reason) {
      reason = `${crop_type.charAt(0).toUpperCase() + crop_type.slice(1)} grows best in ${compatibleSoils.join(" or ")} soil. ${soil_type.charAt(0).toUpperCase() + soil_type.slice(1)} soil has poor water retention for ${crop_type} cultivation.`;
    }
  }

  // 3. Temperature Check
  if (temperature !== null && temperature !== undefined) {
    const tempRange = TEMPERATURE_RANGES[crop_type];
    if (tempRange && temperature >= tempRange.min && temperature <= tempRange.max) {
      checks.temperature = "✅";
    } else if (tempRange) {
      if (!failedCheck) failedCheck = "temperature";
      if (!reason) {
        reason = `Current temperature ${temperature}°C is ${temperature < tempRange.min ? 'too low' : 'too high'} for ${crop_type}. ${crop_type.charAt(0).toUpperCase() + crop_type.slice(1)} requires ${tempRange.min}–${tempRange.max}°C for healthy growth.`;
      }
    } else {
      checks.temperature = "✅"; // No range defined, assume OK
    }
  } else {
    checks.temperature = "⚠️"; // No temperature data
    warnings.push("Temperature data not available for validation");
  }

  // 4. Soil Moisture Check
  if (soil_moisture !== null && soil_moisture !== undefined) {
    if (soil_moisture > 85) {
      if (!failedCheck) failedCheck = "moisture";
      if (!reason) {
        reason = `Soil moisture is already at ${soil_moisture}%. No irrigation needed currently. Re-check in 24 hours.`;
      }
    } else {
      checks.moisture = "✅";
    }
  } else {
    checks.moisture = "⚠️"; // No moisture data
    warnings.push("Soil moisture data not available for validation");
  }

  const passed = !failedCheck;

  return {
    passed,
    reason,
    failedCheck,
    checks,
    warnings,
    currentSeason,
    recommendations: passed ? getCropRecommendations(crop_type) : []
  };
}

/**
 * Get sowing months for a season
 * @param {string} season
 * @returns {string}
 */
function getSeasonMonths(season) {
  const months = {
    Kharif: "June–October",
    Rabi: "November–March",
    Zaid: "April–May"
  };
  return months[season] || "seasonal";
}

/**
 * Get crop-specific recommendations
 * @param {string} cropType
 * @returns {Array<string>}
 */
function getCropRecommendations(cropType) {
  const recommendations = {
    wheat: [
      "Water early morning or evening to reduce evaporation",
      "Check soil moisture before each session",
      "Apply nitrogen fertilizer during tillering stage",
      "Monitor for rust disease during humid conditions"
    ],
    rice: [
      "Maintain standing water during early growth stages",
      "Apply phosphorus fertilizer at transplanting",
      "Monitor for pest attacks during flowering",
      "Ensure proper drainage during maturation"
    ],
    cotton: [
      "Water regularly during boll formation",
      "Apply potassium fertilizer for better fiber quality",
      "Monitor for bollworm infestation",
      "Avoid water stress during flowering"
    ],
    sugarcane: [
      "Deep irrigation every 10-15 days",
      "Apply nitrogen in splits throughout growth",
      "Monitor for red rot disease",
      "Ensure good drainage to prevent waterlogging"
    ],
    maize: [
      "Water during tasseling and silking stages",
      "Apply zinc fertilizer if deficiency observed",
      "Monitor for corn borer attacks",
      "Avoid water stress during pollination"
    ],
    vegetables: [
      "Frequent light irrigation to maintain soil moisture",
      "Use mulch to reduce evaporation",
      "Monitor for fungal diseases in humid conditions",
      "Apply balanced NPK fertilizer regularly"
    ],
    fruits: [
      "Deep watering less frequently for root development",
      "Avoid overhead watering to prevent fungal diseases",
      "Apply organic matter for better fruit quality",
      "Monitor soil pH regularly"
    ]
  };

  return recommendations[cropType] || [
    "Water early morning or evening to reduce evaporation",
    "Check soil moisture before each session",
    "Monitor for pests and diseases regularly",
    "Apply appropriate fertilizers based on soil test"
  ];
}

/**
 * Validate and plan irrigation for crop data
 * @param {Object} input - Input data with crop, soilType, sowingDate, soilMoisture, humidity, waterLevel, fieldArea, city, state
 * @returns {Object} - Validation result with specific format
 */
function validateAndPlan(input) {
  const {
    crop,
    soilType,
    sowingDate,
    soilMoisture,
    humidity,
    waterLevel,
    fieldArea,
    city,
    state
  } = input;

  // Normalize crop type
  const cropType = crop.toLowerCase();

  // Determine season from sowing date
  const sowingMonth = new Date(sowingDate).getMonth() + 1;
  let season;
  if (sowingMonth >= 6 && sowingMonth <= 10) season = "Kharif";
  else if (sowingMonth >= 11 || sowingMonth <= 3) season = "Rabi";
  else season = "Zaid";

  const checks = {
    soil: { passed: false, note: "" },
    season: { passed: false, note: "" },
    moisture: { passed: false, note: "" },
    location: { passed: false, note: "" }
  };

  let failedAt = null;
  let reason = "";
  let suggestion = "";

  // 1. Soil Check
  const compatibleSoils = SOIL_CROP_COMPATIBILITY[cropType] || [];
  if (compatibleSoils.includes(soilType.toLowerCase())) {
    checks.soil = { passed: true, note: `${soilType} soil is suitable for ${crop}` };
  } else {
    failedAt = "soil";
    reason = `${crop} grows best in ${compatibleSoils.join(" or ")} soil`;
    suggestion = `Consider changing to ${compatibleSoils[0]} soil or select a different crop`;
    checks.soil = { passed: false, note: `${soilType} soil is not ideal for ${crop}` };
  }

  // 2. Season Check
  const compatibleSeasons = CROP_SEASON_COMPATIBILITY[cropType] || [];
  if (compatibleSeasons.includes(season)) {
    checks.season = { passed: true, note: `${season} season is suitable for ${crop}` };
  } else {
    if (!failedAt) failedAt = "season";
    if (!reason) {
      reason = `${crop} is typically grown in ${compatibleSeasons.join("/")} season`;
      suggestion = `Consider sowing in ${getSeasonMonths(compatibleSeasons[0])}`;
    }
    checks.season = { passed: false, note: `${season} season is not ideal for ${crop}` };
  }

  // 3. Moisture Check
  if (soilMoisture !== null && soilMoisture !== undefined) {
    if (soilMoisture > 85) {
      if (!failedAt) failedAt = "moisture";
      if (!reason) {
        reason = `Soil moisture is already at ${soilMoisture}%`;
        suggestion = "No irrigation needed currently. Check again in 24 hours.";
      }
      checks.moisture = { passed: false, note: `Soil moisture ${soilMoisture}% - too high` };
    } else {
      checks.moisture = { passed: true, note: `Soil moisture ${soilMoisture}% - moderate, irrigation recommended` };
    }
  } else {
    checks.moisture = { passed: true, note: "Soil moisture data not available" };
  }

  // 4. Location Check
  // For now, assume all locations are valid unless specific restrictions
  checks.location = { passed: true, note: "No regional restrictions" };

  if (failedAt) {
    return {
      passed: false,
      failedAt,
      reason,
      suggestion,
      checks
    };
  }

  // All checks passed
  return {
    passed: true,
    checks,
    mlInput: {
      crop: cropType,
      soilType: soilType.toLowerCase(),
      season,
      soilMoisture: soilMoisture || 50,
      humidity: humidity || 65,
      waterLevel: waterLevel || 50,
      fieldArea: parseFloat(fieldArea),
      location: `${city}, ${state}`
    },
    readyForML: true
  };
}

module.exports = {
  validateCropSuitability,
  getCurrentSeason,
  getCropRecommendations,
  validateAndPlan
};
      checks.temperature = "✅";
    } else if (tempRange) {
      if (!failedCheck) failedCheck = "temperature";
      if (!reason) {
        reason = `Current temperature ${temperature}°C is ${temperature < tempRange.min ? 'too low' : 'too high'} for ${crop_type}. ${crop_type.charAt(0).toUpperCase() + crop_type.slice(1)} requires ${tempRange.min}–${tempRange.max}°C for healthy growth.`;
      }
    } else {
      checks.temperature = "✅"; // No range defined, assume OK
    }
  } else {
    checks.temperature = "⚠️"; // No temperature data
    warnings.push("Temperature data not available for validation");
  }

  // 4. Soil Moisture Check
  if (soil_moisture !== null && soil_moisture !== undefined) {
    if (soil_moisture > 85) {
      if (!failedCheck) failedCheck = "moisture";
      if (!reason) {
        reason = `Soil moisture is already at ${soil_moisture}%. No irrigation needed currently. Re-check in 24 hours.`;
      }
    } else {
      checks.moisture = "✅";
    }
  } else {
    checks.moisture = "⚠️"; // No moisture data
    warnings.push("Soil moisture data not available for validation");
  }

  const passed = !failedCheck;

  return {
    passed,
    reason,
    failedCheck,
    checks,
    warnings,
    currentSeason,
    recommendations: passed ? getCropRecommendations(crop_type) : []
  };
}

/**
 * Get sowing months for a season
 * @param {string} season
 * @returns {string}
 */
function getSeasonMonths(season) {
  const months = {
    Kharif: "June–October",
    Rabi: "November–March",
    Zaid: "April–May"
  };
  return months[season] || "seasonal";
}

/**
 * Get crop-specific recommendations
 * @param {string} cropType
 * @returns {Array<string>}
 */
function getCropRecommendations(cropType) {
  const recommendations = {
    wheat: [
      "Water early morning or evening to reduce evaporation",
      "Check soil moisture before each session",
      "Apply nitrogen fertilizer during tillering stage",
      "Monitor for rust disease during humid conditions"
    ],
    rice: [
      "Maintain standing water during early growth stages",
      "Apply phosphorus fertilizer at transplanting",
      "Monitor for pest attacks during flowering",
      "Ensure proper drainage during maturation"
    ],
    cotton: [
      "Water regularly during boll formation",
      "Apply potassium fertilizer for better fiber quality",
      "Monitor for bollworm infestation",
      "Avoid water stress during flowering"
    ],
    sugarcane: [
      "Deep irrigation every 10-15 days",
      "Apply nitrogen in splits throughout growth",
      "Monitor for red rot disease",
      "Ensure good drainage to prevent waterlogging"
    ],
    maize: [
      "Water during tasseling and silking stages",
      "Apply zinc fertilizer if deficiency observed",
      "Monitor for corn borer attacks",
      "Avoid water stress during pollination"
    ],
    vegetables: [
      "Frequent light irrigation to maintain soil moisture",
      "Use mulch to reduce evaporation",
      "Monitor for fungal diseases in humid conditions",
      "Apply balanced NPK fertilizer regularly"
    ],
    fruits: [
      "Deep watering less frequently for root development",
      "Avoid overhead watering to prevent fungal diseases",
      "Apply organic matter for better fruit quality",
      "Monitor soil pH regularly"
    ]
  };

  return recommendations[cropType] || [
    "Water early morning or evening to reduce evaporation",
    "Check soil moisture before each session",
    "Monitor for pests and diseases regularly",
    "Apply appropriate fertilizers based on soil test"
  ];
}

module.exports = {
  validateCropSuitability,
  getCurrentSeason,
  getCropRecommendations
};