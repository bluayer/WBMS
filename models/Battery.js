const mongoose = require('mongoose');

const { Schema } = mongoose;

const batterySchema = new Schema({
  name: String,
  minimum: Number,
  maximum: Number,
});

module.exports = mongoose.model('Battery', batterySchema);
