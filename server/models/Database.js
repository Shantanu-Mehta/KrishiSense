const mongoose = require('mongoose');

const Databaseschema = new mongoose.Schema({
  title: { type: String, required: true },         
  description: { type: String, required: true },   
  photo: {
    data: Buffer,
    contentType: String
  },                      
  status: { type: Boolean, default: true },       
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('forms', Databaseschema);
