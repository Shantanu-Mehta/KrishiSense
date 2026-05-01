function generateFertilizerAdvice(crop, soil) {
  // A generic NPK recommendation engine based on crop and soil type
  const baseNPK = {
    rice: "120:60:40 kg/ha",
    wheat: "120:60:40 kg/ha",
    maize: "120:60:40 kg/ha",
    cotton: "150:60:60 kg/ha",
    sugarcane: "250:100:100 kg/ha",
    soybean: "20:80:40 kg/ha",
    groundnut: "20:50:40 kg/ha",
    chickpea: "20:40:20 kg/ha",
    lentil: "20:40:20 kg/ha",
    mustard: "80:40:40 kg/ha",
    potato: "150:100:100 kg/ha",
    tomato: "100:50:50 kg/ha",
    onion: "100:50:50 kg/ha",
    garlic: "100:50:50 kg/ha",
    cabbage: "120:60:60 kg/ha",
    cauliflower: "120:60:60 kg/ha",
    brinjal: "100:50:50 kg/ha",
    chili: "100:50:50 kg/ha",
    cucumber: "100:50:50 kg/ha",
    pumpkin: "100:50:50 kg/ha"
  };

  const advice = baseNPK[crop] || "Balanced NPK mix (100:50:50)";

  let soilAdvice = "";
  if (soil.includes("alluvial")) {
    soilAdvice = "Highly fertile. Use standard Urea and DAP.";
  } else if (soil.includes("black")) {
    soilAdvice = "Retains moisture well. Requires less frequent fertilization, but ensure good drainage.";
  } else if (soil.includes("red")) {
    soilAdvice = "Often deficient in Nitrogen and Phosphorus. Add organic compost and apply fertilizers in split doses.";
  } else if (soil.includes("laterite")) {
    soilAdvice = "Poor in organic matter. Heavy manuring and organic compost is strongly recommended.";
  } else if (soil.includes("arid") || soil.includes("sandy")) {
    soilAdvice = "Low water retention. Use slow-release fertilizers and organic mulching to prevent leaching.";
  } else if (soil.includes("saline") || soil.includes("alkaline")) {
    soilAdvice = "High salt content. Apply Gypsum to reduce soil alkalinity before adding chemical fertilizers.";
  } else if (soil.includes("peaty") || soil.includes("marshy")) {
    soilAdvice = "Highly acidic. Apply agricultural lime and ensure proper drainage to improve nutrient uptake.";
  } else if (soil.includes("forest")) {
    soilAdvice = "Rich in humus but acidic. Lime application is beneficial.";
  } else {
    soilAdvice = "Maintain organic matter through compost and manure.";
  }

  return `🧪 Fertilizer Recommendation for ${crop.charAt(0).toUpperCase() + crop.slice(1)} in ${soil}: Optimal NPK ratio is roughly ${advice}. ${soilAdvice}`;
}

function generatePestAdvice(crop) {
  const pestMap = {
    rice: "Stem borers and leaf folders are common. Use neem oil spray preventively.",
    wheat: "Monitor for aphids and rust. Ensure adequate spacing for airflow.",
    maize: "Fall armyworm is a major threat. Check whorls regularly.",
    cotton: "High risk of bollworms and whiteflies. Pheromone traps are highly recommended.",
    sugarcane: "Watch out for early shoot borer and red rot.",
    soybean: "Susceptible to whiteflies and root rot. Avoid waterlogging.",
    groundnut: "Monitor for leaf spot (Tikka disease) and aphids.",
    chickpea: "Pod borers are common. Apply Bacillus thuringiensis (Bt) sprays.",
    lentil: "Watch for aphids and wilt. Treat seeds with fungicide before sowing.",
    mustard: "Aphids are a severe pest during the flowering stage.",
    potato: "Late blight is critical. Monitor humidity and use preventive fungicides.",
    tomato: "Fruit borers and whiteflies are common. Use yellow sticky traps.",
    onion: "Thrips and purple blotch can reduce yield. Use neem-based pesticides.",
    garlic: "Similar to onion, watch out for thrips and bulb rot.",
    cabbage: "Diamondback moth is a major pest. Use netting or Bt spray.",
    cauliflower: "Monitor for aphids and diamondback moths.",
    brinjal: "Shoot and fruit borers are very common. Remove infected parts immediately.",
    chili: "Thrips and mites cause leaf curling. Use miticides if necessary.",
    cucumber: "Fruit flies and powdery mildew are common in high humidity.",
    pumpkin: "Watch for fruit flies and pumpkin beetles. Use pheromone traps."
  };
  const advice = pestMap[crop] || "Monitor regularly for local pests and use organic preventive measures.";
  return `🐛 Pest Control: ${advice}`;
}

function generateGrowthAdvice(crop) {
  const growthMap = {
    rice: "Harvest typically in 120-150 days. Maintain 2-5cm standing water initially.",
    wheat: "Harvest typically in 110-130 days. Requires 4-6 irrigations at critical stages.",
    maize: "Harvest in 90-110 days. Do not allow water stress during tasseling.",
    cotton: "Harvest in 150-180 days. Avoid over-watering during boll formation.",
    sugarcane: "Harvest in 10-14 months. Requires deep soil and consistent moisture.",
    soybean: "Harvest in 90-120 days. Ensure good drainage as it cannot tolerate waterlogging.",
    groundnut: "Harvest in 120-140 days. Maintain loose soil for proper peg penetration.",
    chickpea: "Harvest in 110-130 days. Avoid heavy irrigation during the vegetative stage.",
    lentil: "Harvest in 110-120 days. Prefers cool climate and light irrigation.",
    mustard: "Harvest in 110-130 days. First irrigation should be 25-30 days after sowing.",
    potato: "Harvest in 90-120 days. Keep the soil constantly moist but never soggy.",
    tomato: "Harvest begins in 70-90 days. Stake plants to prevent fruit rot.",
    onion: "Harvest in 100-120 days. Stop watering 10-15 days before harvest to allow bulbs to cure.",
    garlic: "Harvest in 120-150 days. Needs a dry period before harvest.",
    cabbage: "Harvest in 80-100 days. Consistent moisture is key to prevent head splitting.",
    cauliflower: "Harvest in 90-110 days. Tie leaves over the head (blanching) to prevent yellowing.",
    brinjal: "Harvest begins in 80-100 days. Regular harvesting encourages more fruit production.",
    chili: "Harvest begins in 70-90 days. Avoid over-watering to prevent fungal root rot.",
    cucumber: "Harvest begins in 50-70 days. Use a trellis to save space and reduce disease.",
    pumpkin: "Harvest in 90-120 days. Needs a lot of space and heavy feeding."
  };
  const advice = growthMap[crop] || "Follow standard agricultural practices for your region.";
  return `🌱 Growth & Care: ${advice}`;
}

function validateAndPlan(input) {
  const crop        = String(input.crop        || "").trim().toLowerCase();
  const soil     = String(input.soilType    || "").trim().toLowerCase();
  const state       = String(input.state       || "").trim().toLowerCase();
  const city        = String(input.city        || "").trim().toLowerCase();
  const sowingDate  = String(input.sowingDate  || "").trim();
  const soilMoisture = input.soilMoisture !== undefined ? Number(input.soilMoisture) : null;

  // Map the exact 20 crops to valid seasons and optimal soils
  const cropDB = {
    rice:        { soils: ["alluvial soil", "clay soil", "black soil"], seasons: ["Kharif"] },
    wheat:       { soils: ["alluvial soil", "black soil"],              seasons: ["Rabi"] },
    maize:       { soils: ["alluvial soil", "red and yellow soil"],     seasons: ["Kharif", "Zaid"] },
    cotton:      { soils: ["black soil", "alluvial soil"],              seasons: ["Kharif"] },
    sugarcane:   { soils: ["alluvial soil", "black soil"],              seasons: ["Kharif", "Rabi"] },
    soybean:     { soils: ["black soil", "alluvial soil"],              seasons: ["Kharif"] },
    groundnut:   { soils: ["arid (desert) soil", "red and yellow soil"],seasons: ["Kharif"] },
    chickpea:    { soils: ["alluvial soil", "black soil"],              seasons: ["Rabi"] },
    lentil:      { soils: ["alluvial soil", "black soil"],              seasons: ["Rabi"] },
    mustard:     { soils: ["alluvial soil", "arid (desert) soil"],      seasons: ["Rabi"] },
    potato:      { soils: ["alluvial soil", "laterite soil"],           seasons: ["Rabi"] },
    tomato:      { soils: ["alluvial soil", "red and yellow soil"],     seasons: ["Rabi", "Zaid"] },
    onion:       { soils: ["alluvial soil", "red and yellow soil"],     seasons: ["Rabi", "Zaid"] },
    garlic:      { soils: ["alluvial soil"],                            seasons: ["Rabi"] },
    cabbage:     { soils: ["alluvial soil", "forest and mountain soil"],seasons: ["Rabi"] },
    cauliflower: { soils: ["alluvial soil", "forest and mountain soil"],seasons: ["Rabi"] },
    brinjal:     { soils: ["alluvial soil", "black soil"],              seasons: ["Kharif", "Rabi"] },
    chili:       { soils: ["alluvial soil", "red and yellow soil"],     seasons: ["Kharif", "Rabi"] },
    cucumber:    { soils: ["alluvial soil", "arid (desert) soil"],      seasons: ["Zaid"] },
    pumpkin:     { soils: ["alluvial soil", "arid (desert) soil"],      seasons: ["Zaid"] }
  };

  const seasonSowingMonths = {
    Kharif: "June to October",
    Rabi:   "November to March",
    Zaid:   "April to May"
  };

  const checks = {
    soil:     { passed: false, note: "" },
    season:   { passed: false, note: "" },
    moisture: { passed: false, note: "" },
    location: { passed: false, note: "" }
  };
  
  const suggestions = [];

  // 1. Unknown Crop Check (Hard Fail)
  if (!cropDB[crop]) {
    return {
      passed: false,
      failedAt: "crop",
      reason: `'${input.crop}' is not a recognised crop.`,
      suggestion: `Supported crops: ${Object.keys(cropDB).join(", ")}`,
      checks
    };
  }

  // 2. Sowing Date Check (Hard Fail if invalid date)
  const date = new Date(sowingDate);
  if (isNaN(date.getTime())) {
    return {
      passed: false,
      failedAt: "date",
      reason: `Sowing date '${input.sowingDate}' is invalid.`,
      suggestion: "Please provide a valid date.",
      checks
    };
  }
  
  const month = date.getMonth() + 1; 
  let season;
  if (month >= 6 && month <= 10) season = "Kharif";
  else if (month >= 11 || month <= 3) season = "Rabi";
  else season = "Zaid"; 

  const validCrops = Object.keys(cropDB).filter(c => 
    cropDB[c].seasons.includes(season) && cropDB[c].soils.includes(soil)
  );
  const validCropsText = validCrops.length > 0 
    ? validCrops.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ") 
    : "none in our database";

  // 3. Soil Validation (Hard Fail)
  if (!cropDB[crop].soils.includes(soil)) {
    const suitableSoils = cropDB[crop].soils.join(" or ");
    return {
      passed: false,
      failedAt: "soil",
      reason: `${crop.charAt(0).toUpperCase() + crop.slice(1)} cannot be grown optimally in ${soil}. It requires ${suitableSoils}.`,
      suggestion: `For ${soil} during the ${season} season, we highly recommend growing: ${validCropsText}.`,
      checks
    };
  } else {
    checks.soil = { passed: true, note: `${soil} is optimal for ${crop}` };
  }

  // 4. Season Validation (Hard Fail)
  if (!cropDB[crop].seasons.includes(season)) {
    const validSeasons = cropDB[crop].seasons;
    const validMonths = validSeasons.map(s => seasonSowingMonths[s]).join(" and ");
    return {
      passed: false,
      failedAt: "season",
      reason: `You cannot sow ${crop} in the ${season} season. It requires the ${validSeasons.join(" or ")} season (${validMonths}).`,
      suggestion: `Since it is currently the ${season} season and you have ${soil}, we highly recommend growing: ${validCropsText}.`,
      checks
    };
  } else {
    const isLateSowing = (season === "Kharif" && month >= 9) || 
                         (season === "Rabi" && (month === 2 || month === 3)) || 
                         (season === "Zaid" && month === 5);
    
    if (isLateSowing) {
      return {
        passed: false,
        failedAt: "season",
        reason: `It is too late in the ${season} season to sow ${crop}. The crop will likely fail.`,
        suggestion: `Since the season is ending, please wait for the next season or choose a different crop. Currently, for ${soil} in the ${season} season, you could have grown: ${validCropsText}.`,
        checks
      };
    } else {
      checks.season = { passed: true, note: `Optimal sowing season (${season})` };
    }
  }

  // 5. Add Fertilizer, Pest, and Growth Recommendations
  const fertAdvice = generateFertilizerAdvice(crop, soil);
  const pestAdvice = generatePestAdvice(crop);
  const growthAdvice = generateGrowthAdvice(crop);
  
  suggestions.push(fertAdvice);
  suggestions.push(pestAdvice);
  suggestions.push(growthAdvice);

  // 6. Moisture Checks
  if (soilMoisture !== null) {
    if (soilMoisture > 85) {
      suggestions.push(`💧 Moisture Alert: Soil is already saturated (${soilMoisture}%). Do not irrigate until it drops.`);
    } else if (soilMoisture < 5) {
      suggestions.push(`🔥 Moisture Alert: Soil is critically dry (${soilMoisture}%). Irrigate immediately after sowing.`);
    }
  }

  // 7. Sensor Checks (pH, Temp, Humidity)
  const ph = input.ph ?? null;
  const temp = input.temperature ?? null;
  const hum = input.humidity ?? null;
  
  if (ph !== null) {
    if (ph < 5.5) suggestions.push(`⚗️ pH Alert: Highly acidic (${ph}). Use agricultural lime.`);
    else if (ph > 7.5) suggestions.push(`⚗️ pH Alert: Highly alkaline (${ph}). Use sulfur or compost.`);
  }
  
  if (temp !== null) {
    if (temp > 35) suggestions.push(`🌡️ Temperature Alert: High heat (${temp}°C). Provide shade or increased watering.`);
    else if (temp < 10) suggestions.push(`🌡️ Temperature Alert: Cold stress (${temp}°C). Frost protection may be required.`);
  }

  // Allow all plans to pass through to ML, regardless of warnings
  return {
    passed: true,
    checks,
    suggestions,
    mlInput: {
      crop,
      soilType:     soil,
      season,
      soilMoisture: soilMoisture,
      humidity:     input.humidity     ?? null,
      temperature:  input.temperature  ?? null,
      ph:           input.ph           ?? null,
      waterLevel:   input.waterLevel   ?? null,
      fieldArea:    input.fieldArea    ?? null,
      location:     `${input.city}, ${input.state}`
    },
    readyForML: true
  };
}

module.exports = { validateAndPlan };
