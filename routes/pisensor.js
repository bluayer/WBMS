const express = require('express');
const axios = require('axios');

const PiSensor = require('../models/PiSensor');
const calcBatteryRemain = require('../public/javascript/calcBatteryRemain');
const management = require('../public/javascript/management');

const Console = console;
const router = express.Router();

const kpload = async () => {
  let i = 0;
  const kpjson = await axios.get('https://fya10l15m8.execute-api.us-east-1.amazonaws.com/Stage');
  const temp = await JSON.parse(kpjson);
  const dailyKps = await kpjson.breakdown;
  const kparray = [];

  for (; i < dailyKps.length; i += 3) {
    kparray.push(dailyKps[i]);
  }
};


// GET '/pisensor'
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
    } else {
      Console.log('Save okay');
    }
  });

  res.json(management.makeMessage(temperature, tempMin, tempMax, batteryRemain));
});

module.exports = router;
