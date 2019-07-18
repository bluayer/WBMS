const mongoose = require('mongoose');

const { Schema } = mongoose;

const sensorSchema = new Schema({
  pi_id: Number,
  temperature: Number,
  soc: Number,
  location: String,
  t_min: Number,
  t_max: Number,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Sensor', sensorSchema);
