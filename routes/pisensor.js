const express = require('express');
const axios = require('axios');
const PiSensor = require('../models/PiSensor');
const calcBatteryRemain = require('./calcBatteryRemain');
const management = require('./management');

const Console = console;
const router = express.Router();


// kp value load from json to array
function pushAsync(kparray, i, dailyKps) {
  return new Promise((resolve) => {
    setTimeout(() => {
      kparray.push(dailyKps[i]);
      resolve(kparray);
    }, 10);
  });
}


async function printAll(kparray, dailyKps) {
  for (let i = 0; i < dailyKps.length; i + 3) { // for 안에서 비동기 함수가 동작할 것이다.
    pushAsync(kparray, i, dailyKps);// promise 를 리턴해야 await 로 사용 가능 하다.
  }
}


const kpload = async () => {
  const kpjson = await axios.get('https://fya10l15m8.execute-api.us-east-1.amazonaws.com/Stage');
  const kp = await JSON.parse(kpjson);
  const dailyKps = await kp.breakdown[0];
  const kparray = [];
  printAll(kparray, dailyKps);
};


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
