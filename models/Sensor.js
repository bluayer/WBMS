var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sensorSchema = new Schema({
    temperature: Number,
    soc: Number,
    date: { type: Date, default: Date.now  }
});

module.exports = mongoose.model('Sensor', sensorSchema);