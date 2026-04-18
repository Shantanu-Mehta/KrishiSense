const mongoose = require('mongoose');

const IrrigationSchema = new mongoose.Schema({
  fieldId: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  volumeLiters: { type: Number },
  method: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('irrigation_details', IrrigationSchema);
