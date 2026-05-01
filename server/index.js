const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const PORT = 5000;

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true                
}));
app.use(express.json());


app.use('/api/data', require('./routes/Database'));
app.use('/api/esp32', require('./routes/Esp32'));
app.use('/api/irrigation', require('./routes/IrrigationPlan'));


mongoose.connect(process.env.MONGO_URI, {


})
.then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => console.error('MongoDB connection error:', err));
