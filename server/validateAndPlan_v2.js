// cropValidationService.js
// Validation order: soil → season → soilMoisture
// pH, temperature, humidity intentionally excluded (handled by ML layer)

function validateAndPlan(input) {

  // ── Normalise all string inputs ──────────────────────────────
  const crop        = String(input.crop        || "").trim().toLowerCase();
  const rawSoil     = String(input.soilType    || "").trim().toLowerCase();
  const state       = String(input.state       || "").trim().toLowerCase();
  const city        = String(input.city        || "").trim().toLowerCase();
  const sowingDate  = String(input.sowingDate  || "").trim();
  const soilMoisture = input.soilMoisture !== undefined ? Number(input.soilMoisture) : null;

  // ── Soil type aliases (Indian soil names → logic keys) ───────
  // Handles both full names AND shorthand inputs
  const soilMap = {
    "alluvial":                   "loamy",
    "alluvial soil":              "loamy",
    "black":                      "black",
    "black soil":                 "black",
    "black cotton":               "black",
    "black cotton soil":          "black",
    "red":                        "red",
    "red soil":                   "red",
    "red and yellow":             "red",
    "red and yellow soil":        "red",
    "laterite":                   "red",
    "laterite soil":              "red",
    "sandy":                      "sandy",
    "sandy soil":                 "sandy",
    "arid":                       "sandy",
    "arid soil":                  "sandy",
    "desert soil":                "sandy",
    "arid (desert) soil":         "sandy",
    "loamy":                      "loamy",
    "loamy soil":                 "loamy",
    "clay":                       "clay",
    "clay soil":                  "clay",
    "saline":                     "saline",
    "saline soil":                "saline",
    "alkaline soil":              "saline",
    "saline and alkaline soil":   "saline",
    "peaty":                      "peat",
    "peat":                       "peat",
    "peaty soil":                 "peat",
    "marshy soil":                "peat",
    "peaty and marshy soil":      "peat",
    "forest soil":                "loamy",
    "mountain soil":              "loamy",
    "forest and mountain soil":   "loamy"
  };

  const soil = soilMap[rawSoil] || rawSoil; // fallback to raw if not in map

  // ── Crop database ────────────────────────────────────────────
  const cropDB = {
    rice:        { soils: ["loamy", "clay"],                seasons: ["Kharif"] },
    wheat:       { soils: ["loamy", "clay", "black"],       seasons: ["Rabi"]   },
    maize:       { soils: ["loamy", "sandy", "red"],        seasons: ["Kharif", "Zaid"] },
    cotton:      { soils: ["black", "loamy", "red"],        seasons: ["Kharif"] },
    sugarcane:   { soils: ["loamy", "clay"],                seasons: ["Kharif", "Rabi"] },
    soybean:     { soils: ["black", "loamy"],               seasons: ["Kharif"] },
    groundnut:   { soils: ["sandy", "loamy", "red"],        seasons: ["Kharif"] },
    chickpea:    { soils: ["loamy", "clay"],                seasons: ["Rabi"]   },
    lentil:      { soils: ["loamy", "clay"],                seasons: ["Rabi"]   },
    mustard:     { soils: ["loamy", "sandy"],               seasons: ["Rabi"]   },
    potato:      { soils: ["loamy"],                        seasons: ["Rabi"]   },
    tomato:      { soils: ["loamy", "sandy"],               seasons: ["Rabi", "Zaid"] },
    onion:       { soils: ["loamy", "sandy"],               seasons: ["Rabi", "Zaid"] },
    garlic:      { soils: ["loamy", "sandy"],               seasons: ["Rabi"]   },
    cabbage:     { soils: ["loamy"],                        seasons: ["Rabi"]   },
    cauliflower: { soils: ["loamy"],                        seasons: ["Rabi"]   },
    brinjal:     { soils: ["loamy", "sandy"],               seasons: ["Kharif", "Rabi"] },
    chili:       { soils: ["loamy", "sandy"],               seasons: ["Kharif", "Rabi"] },
    cucumber:    { soils: ["loamy", "sandy"],               seasons: ["Zaid"]   },
    pumpkin:     { soils: ["loamy", "sandy"],               seasons: ["Zaid"]   }
  };

  // ── Season best sowing months (for suggestion messages) ──────
  const seasonSowingMonths = {
    Kharif: "June to October",
    Rabi:   "November to March",
    Zaid:   "April to May"
  };

  // ── Soil moisture status label ────────────────────────────────
  function moistureNote(val) {
    if (val <= 30)  return "Dry — irrigation urgently needed";
    if (val <= 60)  return "Moderate — irrigation recommended";
    return                 "Adequate — light irrigation suggested";
  }

  // ── Build empty checks object ─────────────────────────────────
  const checks = {
    soil:     { passed: false, note: "" },
    season:   { passed: false, note: "" },
    moisture: { passed: false, note: "" },
    location: { passed: false, note: "" }
  };

  // ── Unknown crop guard ────────────────────────────────────────
  if (!cropDB[crop]) {
    return {
      passed: false,
      failedAt: "crop",
      reason: `'${input.crop}' is not a recognised crop in our system.`,
      suggestion: `Supported crops: ${Object.keys(cropDB).join(", ")}`,
      checks
    };
  }

  // ── Invalid sowing date guard ─────────────────────────────────
  const date = new Date(sowingDate);
  if (isNaN(date.getTime())) {
    return {
      passed: false,
      failedAt: "date",
      reason: `Sowing date '${input.sowingDate}' is not a valid date.`,
      suggestion: "Please provide a date in YYYY-MM-DD format.",
      checks
    };
  }
  const month = date.getMonth() + 1; // 1–12

  // ── Derive season ─────────────────────────────────────────────
  let season;
  if (month >= 6  && month <= 10) season = "Kharif";
  else if (month >= 11 || month <= 3) season = "Rabi";
  else season = "Zaid"; // April–May


  // ════════════════════════════════════════════════════════════
  //  VALIDATION STEP 1 — SOIL (most important, checked first)
  // ════════════════════════════════════════════════════════════

  // Block universally difficult soils first
  if (soil === "saline" || soil === "peat") {
    checks.soil = {
      passed: false,
      note: `${input.soilType} is not suitable for crop cultivation without treatment`
    };
    return {
      passed: false,
      failedAt: "soil",
      reason: `${input.soilType} has extreme conditions — too saline or waterlogged for ${crop}.`,
      suggestion: soil === "saline"
        ? "Treat soil with gypsum to reduce salinity before planting."
        : "Improve drainage and add organic matter before planting.",
      checks
    };
  }

  // Unknown soil type that wasn't in soilMap
  const knownSoils = ["loamy", "clay", "black", "red", "sandy"];
  if (!knownSoils.includes(soil)) {
    checks.soil = { passed: false, note: `'${input.soilType}' not recognised` };
    return {
      passed: false,
      failedAt: "soil",
      reason: `Soil type '${input.soilType}' is not recognised.`,
      suggestion: `Known soil types: Alluvial, Black, Red, Laterite, Sandy, Loamy, Clay.`,
      checks
    };
  }

  // Crop-soil compatibility
  if (!cropDB[crop].soils.includes(soil)) {
    // Find what crops DO grow in this soil — use original mapped soil
    const suitableCrops = Object.keys(cropDB)
      .filter(c => cropDB[c].soils.includes(soil))
      .join(", ");

    checks.soil = {
      passed: false,
      note: `${input.soilType} (${soil}) not compatible with ${crop}`
    };
    return {
      passed: false,
      failedAt: "soil",
      reason: `${crop.charAt(0).toUpperCase() + crop.slice(1)} grows best in `
             + `${cropDB[crop].soils.join(" or ")} soil. `
             + `Your soil is ${input.soilType} (${soil}).`,
      suggestion: `Crops that grow well in ${input.soilType}: ${suitableCrops}.`,
      checks
    };
  }

  checks.soil = {
    passed: true,
    note: `${input.soilType} is suitable for ${crop}`
  };


  // ════════════════════════════════════════════════════════════
  //  VALIDATION STEP 2 — SEASON
  // ════════════════════════════════════════════════════════════

  if (!cropDB[crop].seasons.includes(season)) {
    const validSeasons   = cropDB[crop].seasons;
    const validMonths    = validSeasons.map(s => seasonSowingMonths[s]).join(" or ");

    checks.season = {
      passed: false,
      note: `${season} not valid for ${crop}`
    };
    return {
      passed: false,
      failedAt: "season",
      reason: `Your sowing date (month ${month}) falls in ${season} season. `
             + `${crop.charAt(0).toUpperCase() + crop.slice(1)} requires `
             + `${validSeasons.join(" or ")} season.`,
      suggestion: `Sow ${crop} between ${validMonths}.`,
      checks
    };
  }

  checks.season = {
    passed: true,
    note: `${season} season is correct for ${crop}`
  };


  // ════════════════════════════════════════════════════════════
  //  VALIDATION STEP 3 — SOIL MOISTURE (ESP32 sensor)
  // ════════════════════════════════════════════════════════════

  if (soilMoisture === null) {
    // Sensor offline — skip check but warn
    checks.moisture = {
      passed: true,
      note: "Soil moisture sensor offline — skipped, proceed with caution"
    };
  } else if (soilMoisture > 85) {
    checks.moisture = {
      passed: false,
      note: `Soil moisture ${soilMoisture}% — already saturated`
    };
    return {
      passed: false,
      failedAt: "moisture",
      reason: `Soil moisture is ${soilMoisture}% — soil is already saturated. `
             + `Irrigation is not needed right now.`,
      suggestion: "Wait until soil moisture drops below 85% before irrigating. Check again in 24 hours.",
      checks
    };
  } else if (soilMoisture < 5) {
    checks.moisture = {
      passed: false,
      note: `Soil moisture ${soilMoisture}% — sensor may be offline or critically dry`
    };
    return {
      passed: false,
      failedAt: "moisture",
      reason: `Soil moisture reading is ${soilMoisture}% — this is critically low or the sensor may be disconnected.`,
      suggestion: "Check ESP32 sensor connection. If soil is genuinely this dry, irrigate immediately.",
      checks
    };
  } else {
    checks.moisture = {
      passed: true,
      note: `${soilMoisture}% — ${moistureNote(soilMoisture)}`
    };
  }


  // ════════════════════════════════════════════════════════════
  //  VALIDATION STEP 4 — LOCATION (lightweight water stress check)
  // ════════════════════════════════════════════════════════════

  // High water-demand crops in water-scarce states
  const waterIntensiveCrops  = ["rice", "sugarcane"];
  const waterScarceStates    = ["rajasthan", "gujarat", "haryana", "punjab", "maharashtra"];

  if (waterIntensiveCrops.includes(crop) && waterScarceStates.includes(state)) {
    checks.location = {
      passed: false,
      note: `${crop} is water-intensive and ${input.state} has water scarcity risk`
    };
    return {
      passed: false,
      failedAt: "location",
      reason: `${crop.charAt(0).toUpperCase() + crop.slice(1)} requires high water. `
             + `${input.state} faces water scarcity which makes this unsustainable.`,
      suggestion: `Consider drip irrigation, or grow less water-intensive crops like `
                + `wheat, mustard, or chickpea in ${input.state}.`,
      checks
    };
  }

  checks.location = {
    passed: true,
    note: `${input.city}, ${input.state} — no regional restrictions for ${crop}`
  };


  // ════════════════════════════════════════════════════════════
  //  ALL CHECKS PASSED — prepare ML input
  // ════════════════════════════════════════════════════════════

  return {
    passed: true,
    checks,
    mlInput: {
      crop,
      soilType:     soil,
      season,
      soilMoisture: soilMoisture,
      humidity:     input.humidity     ?? null,
      waterLevel:   input.waterLevel   ?? null,
      fieldArea:    input.fieldArea    ?? null,
      location:     `${input.city}, ${input.state}`
    },
    readyForML: true
  };
}

module.exports = { validateAndPlan };
