const express = require('express');
// const schedule = require('node-schedule');
const PiInfo = require('../models/PiInfo');

const Console = console;
const router = express.Router();

// POST '/PiInfo'
// Save data at DB
router.post('/', (req, res) => {
  Console.log(req.body);

  const {
    id, batteryEmerg, kpEmerg,
  } = req.body;

  const piInfo = new PiInfo();

  piInfo.id = id;
  piInfo.batteryEmerg = batteryEmerg;
  piInfo.kpEmerg = kpEmerg;

  PiInfo.save((err) => {
    if (err) {
      Console.error(err);
    } else {
      Console.log('Save okay');
    }
  });

  return res.status(200);
});


router.get('/emerg', (req, res) => {
  PiInfo.find({}).exec((err, emergs) => {
    if (err) {
      Console.log(err);
      res.json(err);
    }

    res.render('emerg', { emergs });
  });
});


module.exports = router;
