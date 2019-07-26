const mongoose = require('mongoose');

const { Schema } = mongoose;

const piEmergschema = new Schema({
  id: Number,
  kpEmerg: { type: Boolean, default: false },
  batteryEmerg: { type: Boolean, default: false },
});

module.exports = mongoose.model('PiEmerg', piEmergschema);
