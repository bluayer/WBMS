const express = require('express');
// const schedule = require('node-schedule');
const PiEmerg = require('../models/PiEmerg');

const Console = console;
const router = express.Router();

// POST '/piemerg'
// Save data at DB
router.post('/', (req, res) => {
  Console.log(req.body);

  const {
    id, batteryEmerg, kpEmerg,
  } = req.body;

  const piEmerg = new PiEmerg();

  piEmerg.id = id;
  piEmerg.batteryEmerg = batteryEmerg;
  piEmerg.kpEmerg = kpEmerg;

  piEmerg.save((err) => {
    if (err) {
      Console.error(err);
    } else {
      Console.log('Save okay');
    }
  });
});


module.exports = router;
