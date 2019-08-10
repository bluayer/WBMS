const mongoose = require('mongoose');

const { Schema } = mongoose;

const piActionSchema = new Schema({
  id: Number,
  action: String,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PiAction', piActionSchema);
