const express = require('express');
const PiSensor = require('../models/PiSensor');
const calcBatteryRemain = require('./calcBatteryRemain');
const management = require('./management');

const Console = console;
const router = express.Router();

// GET '/sensor'
// Just render test.ejs
router.get('/', (req, res) => {
  PiSensor.find({}).exec((err, sensors) => {
    if (err) {
      Console.log(err);
      res.json(err);
    }

    res.render('sensor', { sensors });
  });
});

// POST '/sensor'
// Save data at DB
router.post('/', (req, res) => {
  const tempMin = 0;
  const tempMax = 40;

  const {
    id, temperature, voltage, location, date,
  } = req.body;

  const batteryRemain = calcBatteryRemain(voltage);
  const piSensor = new PiSensor();

  piSensor.id = id;
  piSensor.temperature = temperature;
  piSensor.batteryRemain = batteryRemain;
  piSensor.location = location;
  piSensor.tempMin = tempMin;
  piSensor.tempMax = tempMax;
  piSensor.date = new Date(date);

  piSensor.save((err) => {
    if (err) {
      Console.error(err);
    }
    Console.log('Save okay');
  });

  res.json(management.makeMessage(temperature, tempMin, tempMax, batteryRemain));
});

module.exports = router;
