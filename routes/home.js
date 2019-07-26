const express = require('express');
const PiSensor = require('../models/PiSensor');

const PiEmerg = require('../models/PiEmerg');

const router = express.Router();
const Console = console;

// GET '/'
// Render index.ejs
router.get('/', (req, res) => {
  // emergency 체크
  PiEmerg.find({}).exec((err, emergs) => {
    if (err) {
      Console.log(err);
      res.json(err);
    }

    res.render('main', { emergs });
  });
});

const pushData = (len, data) => {
  const batteryRemains = [];
  const temperatures = [];
  const dates = [];
  const result = {};

  for (let i = 0; i < len; i += 1) {
    batteryRemains.push(data[i].batteryRemain);
    temperatures.push(data[i].temperature);
    const hour = data[i].date.getHours();
    const min = data[i].date.getMinutes();
    const time = `${hour}:${min}`;
    // Console.log(typeof time);
    dates.push(time);
  }
  result.temperatures = temperatures;
  result.batteryRemains = batteryRemains;
  result.dates = dates;
  return result;
};

router.get('/statistic/:id', (req, res) => {
  const { id } = req.params;
  const numID = Number(id);
  let statisticData = {};

  PiSensor.find({ id: numID }).sort({ date: 'desc' }).exec((err, data) => {
    if (err) {
      Console.log(err);
    }
    // const last = data.length - 1;
    if (data.length > 7) {
      statisticData = pushData(7, data);
    } else {
      statisticData = pushData(data.length, data);
    }
    // res.send(statisticData);
    // Console.log(statisticData);
    res.render('statistic', { id, statisticData });
  });
});


router.get('/statistics', (req, res) => {
  res.render('statistics');
});

module.exports = router;
