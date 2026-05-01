const mongoose = require('mongoose');

const IrrigationPlanSchema = new mongoose.Schema({
  plan_id: { type: String, required: true, unique: true },
  crop: { type: String, required: true },
  soil_type: { type: String, required: true },
  sowing_date: { type: Date, required: true },
  field_area: { type: Number, required: true },
  location: { type: String, required: true },
  season: { type: String, required: true },
  should_irrigate: { type: Boolean, required: true },
  water_amount_per_session: { type: Number, required: true },
  schedule: [{
    day: { type: Number, required: true },
    date: { type: String, required: true },
    should_irrigate: { type: Boolean, required: true },
    water_amount: { type: Number, required: true },
    sessions: [{
      session_number: { type: Number, required: true },
      time: { type: String, required: true },
      end_time: { type: String, required: true },
      duration_minutes: { type: Number, required: true },
      water_amount_liters: { type: Number }
    }]
  }],
  recommendations: [{ type: String }],
  sensor_data: {
    temperature: { type: Number },
    humidity: { type: Number },
    soil_moisture: { type: Number },
    water_level: { type: Number },
    ph: { type: Number },
    timestamp: { type: Date }
  },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IrrigationPlan', IrrigationPlanSchema);