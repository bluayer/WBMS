const express = require('express');
const PiSensor = require('../models/PiSensor');
const CalcBatteryRemain = require('./CalcBatteryRemain');

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
    res.render('pisensor', { sensors });
  });
});

// POST '/sensor'
// Save data at DB
router.post('/', (req, res) => {
  const pisensor = new PiSensor();
  pisensor.temperature = req.body.temperature;
  pisensor.betteryRemain = CalcBatteryRemain(req.body.voltage);
  pisensor.date = new Date(req.body.date);

  pisensor.save((err) => {
    if (err) {
      Console.error(err);
      res.json({ result: 0 });
    }
  });
  res.json({ result: 1 });
});

module.exports = router;
