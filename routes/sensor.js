const express = require("express");
const router = express.Router();
const Sensor = require("../models/Sensor");

router.get("/", function(req, res){
  Sensor.find({})
  .exec((err, sensors) => {
    if(err) return res.json(err);
    res.render("test", {sensors});
  });
});

router.post('/', function(req, res){
  let sensor = new Sensor();
  sensor.temperature = req.body.temperature;
  sensor.soc = req.body.soc;
  sensor.date = new Date(req.body.date);
  
  sensor.save((err) => {
      if(err){
          console.error(err);
          res.json({result: 0});
          return;
      }

      res.json({result: 1});
  });
});

module.exports = router;