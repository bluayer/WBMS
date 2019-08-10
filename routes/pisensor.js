// Node modules
const express = require('express');
const axios = require('axios');

// DB models
const PiSensor = require('../models/PiSensor');
const PiInfo = require('../models/PiInfo');
const PiAction = require('../models/PiAction');

// Functions for util
const calcBatteryRemain = require('../public/javascript/calcBatteryRemain');
const management = require('../public/javascript/management');
const dayPredictArgo = require('../public/javascript/dayPredictArgo');
const disconnectedSituation = require('../public/javascript/disconnectedSituation');
const piLocationFunc = require('../public/javascript/piLocationFunc');

const Console = console;
const router = express.Router();

// Function
// For loading raspberry pi's locations and status
// return : Promise(piLocation : Array)
const loadPiLocations = () => piLocationFunc.getPiIds()
  .then(piIds => piLocationFunc.getPiLocations(piIds))
  .then(piLocations => piLocations);

// Fucntion(dailyKps : Array)
// For finding max daily kp
// return : Promise(kp max)
function kpLoad(dailyKps) {
  return new Promise((resolve) => {
    let Max = -1;
    for (let i = 0; i < dailyKps.length; i += 3) {
      if (dailyKps[i].kp > Max) {
        Max = dailyKps[i].kp;
      }
    }
    resolve(Max);
  });
}

// Function(id : Number)
// For find PiInfo with id
// return : Promise(just one PiInfo)
const findPi = id => PiInfo.find({ id }).exec().then(d => d[0]);

// Function(id: Number, sensor: Array, dailyKpMax: Number)
// For comparing sensor's kp and daily max kp and updating info
// return : Promise(emerg : Array(actions))
const chkKpAndUpdate = async (id, sensor, dailyKpMax) => {
  let emerg = null;
  const options = { upsert: true, new: true };
  if (sensor.kpMax <= dailyKpMax) {
    emerg = await disconnectedSituation.disconnectedSituation(
      sensor.id, sensor.latitude, sensor.longitude,
    ).then(actions => actions);
    PiInfo.findOneAndUpdate({ id }, { kpEmerg: true }, options)
      .exec((queryErr) => {
        if (queryErr) {
          Console.log(queryErr);
        }
      });
  } else {
    PiInfo.findOneAndUpdate({ id }, { kpEmerg: false }, options)
      .exec((queryErr) => {
        if (queryErr) {
          Console.log(queryErr);
        }
      });
  }
  return emerg;
};

// Function(id : Number)
// get Action with kp value
// return : Promise(emerg : Array(actions))
const kpEmergency = async (id) => {
  const kpjson = await axios.get('https://fya10l15m8.execute-api.us-east-1.amazonaws.com/Stage');
  const dailyKps = await kpjson.data.breakdown;
  const dailyKpMax = await kpLoad(dailyKps);
  const sensor = await findPi(id);
  const response = await chkKpAndUpdate(id, sensor, dailyKpMax).then(emerg => emerg);
  return response;
};

// Function(batteryRemain: Number, id: Number, latitude: Number, longitude: Number)
// Check BatteryRemain and decide it is disconnected situation
// If batterRemain is low(15%), it decide it has to be disconneced.
// return : Promise( null || actions : Array)
const chkBatteryRemain = async (
  batteryRemain, id, latitude, longitude,
) => {
  let response = null;
  if (batteryRemain <= 15) {
    response = await disconnectedSituation.disconnectedSituation(
      id, latitude, longitude,
    ).then(actions => actions);

    PiInfo.findOneAndUpdate({ id }, { batteryEmerg: true })
      .exec((err, data) => {
        if (err) {
          Console.log(err);
        }
        Console.log(`DISCONNECT ${data}`);
      });
  } else {
    PiInfo.findOneAndUpdate({ id }, { batteryEmerg: false })
      .exec((err, data) => {
        if (err) {
          Console.log(err);
        }
        Console.log(`NOT DISCONNECT ${data}`);
      });
  }

  return response;
};

// Function(utcDate : date, delay : string(for date))
// Calculate time delay
const calcTimeDelay = (utcDate, delay) => {
  const totalTime = Math.abs(utcDate - new Date(delay)) / 1000;
  const hour = parseInt(totalTime / 3600, 10);
  const min = parseInt((totalTime % 3600) / 60, 10);
  const sec = parseInt(totalTime % 60, 10);
  const newTime = `${hour}/${min}/${sec}`;
  return newTime;
};

// GET '/pisensor'
// Just render test.ejs
router.get('/', (req, res) => {
  PiSensor.find({}).exec((err, sensors) => {
    if (err) {
      Console.log(err);
      res.json(err);
    }

    res.render('sensor', { sensors });
  });
});

// Router
// POST '/pisensor'
// Save data from raspberry pi at DB.
// Call the function about strategy.
// Send actions to raspberry pi.
router.post('/', async (req, res) => {
  // Console.log(req.body);
  const tempMin = 5;
  const tempMax = 35;

  const {
    id, temperature, voltage, latitude, longitude, kpMax, date,
  } = req.body;

  const batteryRemain = await calcBatteryRemain(voltage);
  const objectDate = new Date(date);
  const utcDate = new Date(`${objectDate.getUTCFullYear()}-${objectDate.getUTCMonth() + 1}-${objectDate.getUTCDate()} ${objectDate.getUTCHours()}:${objectDate.getUTCMinutes()}:${objectDate.getUTCSeconds()}`);
  PiInfo.find({ id }).exec().then((data) => {
    // If there's no records with input id
    if (!data.length) {
      PiInfo.create({
        id, latitude, longitude, tempMin, tempMax, kpMax,
      }, (error, d) => {
        if (error) {
          Console.error(error);
        } else {
          Console.log('Pi info Save okay');
          Console.log(d);
        }
      });
    }
  }).then(() => {
    // check it is disconnected Situation
    // Reason : batteryRemain < 15
    chkBatteryRemain(
      batteryRemain, id, latitude, longitude,
    )
      .then(async (actions) => {
        // Execute at 00:00 ~ 00:15 everyday, each raspberry pi.
        if (
          objectDate.getHours() === 0
          && objectDate.getMinutes() >= 0 && objectDate.getMinutes() < 15) {
          // If it's extreme weather, set tempMin, tempMax
          dayPredictArgo.dayPredictArgo(id, latitude, longitude, 1);
          // Check kp emergenct(geomagnetic storm)
          const emerg = await kpEmergency(id);
          if (actions === null) {
            return emerg;
          }
        }
        return actions;
      })
      .then((forecastAction) => {
        const sense = PiInfo.findOne({ id }).exec();
        return sense.then((senseData) => {
          const premsg = { action: [] };
          const defaultAction = management.makeMessage(
            temperature, senseData.tempMin, senseData.tempMax, batteryRemain,
          );
          // Delay format : 'hour/min/sec'
          defaultAction.delay = '0/0/0';
          premsg.action.push(defaultAction);
          if (forecastAction !== null) {
            forecastAction.forEach((action) => {
              const newAction = action;
              newAction.delay = calcTimeDelay(utcDate, action.delay);
              premsg.action.push(newAction);
            });
          }
          return premsg;
        });
      })
      .then((msg) => {
        // Send msg to raspberry pi.
        res.send(msg);
        // Make message string for save.
        const stringMsg = JSON.stringify(msg);
        PiAction.create({ id, action: stringMsg }, (msgError, d) => {
          if (msgError) {
            Console.error(msgError);
          } else {
            Console.log('Pi Msg Save okay');
            Console.log(d);
          }
        });
        return msg;
      });
  });

  PiSensor.create({
    id, temperature, batteryRemain, date: objectDate,
  }, (err, data) => {
    if (err) {
      Console.error(err);
    } else {
      Console.log('Pi Sensor Save okay');
      Console.log(data);
    }
  });

  return res.status(200);
});

// Router
// Get '/pisensor/showmsg'
// Show actions at front
router.get('/showmsg', (req, res) => {
  PiAction.find({}).exec((err, messages) => {
    if (err) {
      Console.log(err);
      res.json(err);
    }

    res.render('message', { messages });
  });
});

// GET '/pisensor/pilocation'
// Just render test.ejs
router.get('/pilocation', (req, res) => {
  loadPiLocations().then((d) => {
    Console.log(d);
    res.send(d);
  });
});

module.exports = router;
