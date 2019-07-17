const express = require('express');

const router = express.Router();

// GET '/'
// Render index.ejs
router.get('/', (req, res) => {
  res.render('main');
});

// GET '/statistic'
// Render statistic.ejs
router.get('/statistic', (req, res) => {
  res.render('statistic');
});

module.exports = router;
