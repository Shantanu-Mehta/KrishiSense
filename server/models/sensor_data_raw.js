const mongoose = require('mongoose');

const SensorDataSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  temperature: { type: Number, default: null },
  humidity: { type: Number, default: null },
  soil_moisture: { type: Number, default: null },
  ph: { type: Number, default: null },
  water_level: { type: Number, default: null },
  rainfall: { type: Number, default: 0 },
  crop_type: { type: String, default: "wheat" },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('sensor_data_raw', SensorDataSchema);
