const express = require('express');

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

// GET '/statistic'
// Render statistic.ejs
router.get('/statistic', (req, res) => {
  res.render('statistic');
});

router.get('/statistics', (req, res) => {
  res.render('statistics');
});

module.exports = router;
