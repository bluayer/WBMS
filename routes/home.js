var express = require("express");
var router  = express.Router();

// Set Router
router.get('/', (req, res) => {
  res.render('index')
});

router.get('/statistic', (req, res) => {
  res.render('statistic')
});


module.exports = router;