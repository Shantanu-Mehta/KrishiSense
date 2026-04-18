const mongoose = require('mongoose');

const PredictSchema = new mongoose.Schema({
  fieldId: { type: String },
  predictedAt: { type: Date, default: Date.now },
  predictionType: { type: String },
  value: { type: mongoose.Schema.Types.Mixed },
  details: { type: Object }
});

module.exports = mongoose.model('predict', PredictSchema);
