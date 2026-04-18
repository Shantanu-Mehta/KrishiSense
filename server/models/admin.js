const mongoose = require('mongoose');

const AdminLSchema = new mongoose.Schema({
    
  username: { type: String, 
             required: true,
             unique: true },
  password: { type: String, 
             required: true ,
  }
});

module.exports = mongoose.model('AdminL', AdminLSchema);
