const mongoose = require('mongoose');

const IrrigationSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  field_id: { type: String, default: "FIELD_01" },
  should_irrigate: { type: Boolean, default: false },
  water_amount: { type: Number, default: 0 },
  pump_command: { type: String, enum: ["PUMP_ON", "PUMP_OFF"], default: "PUMP_OFF" },
  executed: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('irrigation_details', IrrigationSchema);
