const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  type: { type: String, enum: ['error','warning','info'], default: 'info' },
  title: { type: String, required: true },
  message: { type: String },
  fieldId: { type: String },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

module.exports = mongoose.model('alert', AlertSchema);
