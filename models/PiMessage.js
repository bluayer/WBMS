const mongoose = require('mongoose');

const { Schema } = mongoose;

const piMessageSchema = new Schema({
  id: Number,
  message: String,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PiMessage', piMessageSchema);
