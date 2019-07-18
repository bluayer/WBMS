const mongoose = require('mongoose');

const { Schema } = mongoose;

const sensorSchema = new Schema({
  location: String,
  temperature: Number,
  soc: Number,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Sensor', sensorSchema);
