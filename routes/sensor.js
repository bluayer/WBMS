const express = require('express');
const Sensor = require('../models/Sensor');
const Battery = require('../models/Battery');

const Console = console;
const router = express.Router();

// GET '/sensor'
// Just render test.ejs
router.get('/', (req, res) => {
  Sensor.find().sort({ date: 1 }).exec((err, sensors) => {
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
  const sensor = new Sensor();

  sensor.temperature = req.body.temperature;
  sensor.soc = req.body.soc;
  sensor.date = new Date(req.body.date);
  sensor.letitude = req.body.letitude;
  sensor.longitude = req.body.longitude;

  sensor.save((err) => {
    if (err) {
      Console.error(err);
      res.json({ result: 0 });
    }
  });

  // battery
  if (sensor.temperature > )
  

  res.json({ result: 1 });
});

module.exports = router;
