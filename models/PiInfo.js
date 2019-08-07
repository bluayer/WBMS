const mongoose = require('mongoose');

const { Schema } = mongoose;

const piInfoSchema = new Schema({
  id: Number,
  latitude: Number,
  longitude: Number,
  tempMin: Number,
  tempMax: Number,
  kpMax: Number,
  kpEmerg: { type: Boolean, default: false },
  batteryEmerg: { type: Boolean, default: false },
});

module.exports = mongoose.model('PiInfo', piInfoSchema);
