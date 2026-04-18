const mongoose = require('mongoose');

const SensorDataSchema = new mongoose.Schema({
  fieldId: { type: String },
  sensorType: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String },
  timestamp: { type: Date, default: Date.now },
  meta: { type: Object }
});

module.exports = mongoose.model('sensor_data_raw', SensorDataSchema);
