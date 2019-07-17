const express = require('express');
const Sensor = require('../models/Sensor');

const Console = console;
const router = express.Router();

// GET '/sensor'
// Just render test.ejs
router.get('/', (req, res) => {
  Sensor.find({}).exec((err, sensors) => {
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

  sensor.save((err) => {
    if (err) {
      Console.error(err);
      res.json({ result: 0 });
    }
  });
  res.json({ result: 1 });
});

module.exports = router;
