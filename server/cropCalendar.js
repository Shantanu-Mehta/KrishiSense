const cropCalendar = {
  Rice: {
    growthDays: 120,
    waterRequirement: 1200, 
    soilTypes: ['loamy', 'alluvial', 'clayey'],
    minTemp: 20,
    maxTemp: 35,
    optimalRainfall: 150,
    irrigationSchedule: [
      { phase: 'Vegetative', days: 20, interval: 3 },
      { phase: 'Reproductive', days: 60, interval: 2 },
      { phase: 'Maturation', days: 40, interval: 1 }
    ]
  },
  Wheat: {
    growthDays: 110,
    waterRequirement: 450,
    soilTypes: ['loamy', 'alluvial', 'black'],
    minTemp: 15,
    maxTemp: 30,
    optimalRainfall: 60,
    irrigationSchedule: [
      { phase: 'Germination', days: 15, interval: 7 },
      { phase: 'Growth', days: 60, interval: 5 },
      { phase: 'Maturation', days: 35, interval: 3 }
    ]
  },
  Maize: {
    growthDays: 95,
    waterRequirement: 500,
    soilTypes: ['loamy', 'alluvial', 'sandy'],
    minTemp: 18,
    maxTemp: 32,
    optimalRainfall: 75,
    irrigationSchedule: [
      { phase: 'Vegetative', days: 30, interval: 4 },
      { phase: 'Reproductive', days: 45, interval: 2 },
      { phase: 'Grain Fill', days: 20, interval: 1 }
    ]
  },
  Groundnut: {
    growthDays: 150,
    waterRequirement: 600,
    soilTypes: ['sandy', 'loamy', 'laterite'],
    minTemp: 20,
    maxTemp: 35,
    optimalRainfall: 50,
    irrigationSchedule: [
      { phase: 'Vegetative', days: 45, interval: 5 },
      { phase: 'Flowering', days: 60, interval: 3 },
      { phase: 'Pod Development', days: 45, interval: 2 }
    ]
  },
  Cotton: {
    growthDays: 180,
    waterRequirement: 700,
    soilTypes: ['black', 'alluvial', 'loamy'],
    minTemp: 21,
    maxTemp: 35,
    optimalRainfall: 60,
    irrigationSchedule: [
      { phase: 'Vegetative', days: 60, interval: 6 },
      { phase: 'Flowering', days: 80, interval: 4 },
      { phase: 'Boll Development', days: 40, interval: 2 }
    ]
  }
};

module.exports = cropCalendar;
