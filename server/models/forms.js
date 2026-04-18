const mongoose = require('mongoose');

const FormSchema = new mongoose.Schema({
  // Farm and location data
  farm_id: { type: String, required: true, unique: true },
  region: { type: String, required: true },
  
  // Crop type
  crop_type: { type: String, required: true },
  
  // Soil properties (from CSV)
  soil_type: { type: String, required: true },
  soil_moisture_percent: { type: Number, default: 50 }, // CSV: soil_moisture_%
  soil_pH: { type: Number, default: 7.0 },
  
  // Environmental data (from CSV)
  temperature_C: { type: Number, default: 25 },
  rainfall_mm: { type: Number, default: 100 },
  humidity_percent: { type: Number, default: 65 }, // CSV: humidity_%
  
  // Sowing and harvest dates
  sowing_date: { type: Date, required: true },
  harvest_date: { type: Date, default: null },
  crop_growth_days: { type: Number, default: 120 },
  
  // Vegetation Index
  NDVI_index: { type: Number, default: 0.45 },
  
  // ML Recommendation
  recommended_irrigation_mm: { type: Number, default: 0 },
  
  // Schedule and predictions
  predictedSchedule: { type: Object, default: null },
  mlPredictions: { type: Object, default: null },
  recommendations: { type: Array, default: [] },
  
  // Photo
  photo: {
    data: Buffer,
    contentType: String
  },
  
  // Legacy fields for backward compatibility
  fieldId: { type: String },
  title: { type: String },
  description: { type: String },
  
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('forms', FormSchema);
