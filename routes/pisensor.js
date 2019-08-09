const express = require('express');
const axios = require('axios');

const PiSensor = require('../models/PiSensor');
const PiInfo = require('../models/PiInfo');
const PiMessage = require('../models/PiMessage');
const calcBatteryRemain = require('../public/javascript/calcBatteryRemain');
const management = require('../public/javascript/management');
const dayPredictArgo = require('../public/javascript/dayPredictArgo');
const disconnectedSituation = require('../public/javascript/disconnectedSituation');
const piLocationFunc = require('../public/javascript/piLocationFunc');

const Console = console;
const router = express.Router();

const loadPiLocations = () => piLocationFunc.getPiIds()
  .then(piIds => piLocationFunc.getPiLocations(piIds))
  .then(piLocations => piLocations);

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

// KP 비교 이후 discon sit 호출
const kpEmergency = async (id) => {
  let response = null;
  const kpjson = await axios.get('https://fya10l15m8.execute-api.us-east-1.amazonaws.com/Stage');
  const dailyKps = await kpjson.data.breakdown;
  response = await kpLoad(dailyKps).then(async (dailyKpMax) => {
    const options = { upsert: true, new: true };
    let res = null;
    res = await PiInfo.find({ id }).exec(async (err, sensor) => {
      let emerg = null;
      if (err) {
        Console.log(err);
      }
      Console.log(sensor);
      Console.log('kpmax is ', sensor[0].kpMax, ' dailyKpMax is', dailyKpMax);
      if (sensor[0].kpMax <= dailyKpMax) {
        Console.log('welcom kp');
        emerg = await disconnectedSituation.disconnectedSituation(
          sensor[0].id, sensor[0].latitude, sensor[0].longitude,
        ).then((actions) => {
          Console.log('kp emegency!!! :', actions);
          return actions;
        });

        // dailyKpMax를 통해 actions 저장
        PiInfo.findOneAndUpdate({ id }, { kpEmerg: true }, options)
          .exec((queryErr) => {
            if (err) {
              Console.log(queryErr);
            }
          });
      } else {
        PiInfo.findOneAndUpdate({ id }, { kpEmerg: false }, options)
          .exec((queryErr) => {
            if (err) {
              Console.log(queryErr);
            }
          });
      }
      return emerg;
    });
    return res;
  });
  return response;
};

const checkBatteryRemain = async (
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

// POST '/pisensor'
// Save data at DB
router.post('/', async (req, res) => {
  // Console.log(req.body);
  const tempMin = 0;
  const tempMax = 30;

  const {
    id, temperature, voltage, latitude, longitude, kpMax, date,
  } = req.body;

  const batteryRemain = await calcBatteryRemain(voltage);
  const objectDate = new Date(date);
  const newDate = new Date(`${objectDate.getUTCFullYear()}-${objectDate.getUTCMonth() + 1}-${objectDate.getUTCDate()} ${objectDate.getUTCHours()}:${objectDate.getUTCMinutes()}:${objectDate.getUTCSeconds()}`);
  Console.log(objectDate);
  // const options = { upsert: true, new: true };
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
    checkBatteryRemain(
      batteryRemain, id, latitude, longitude,
    )
      .then(async (actions) => {
        // set tempMin, tempMax if it's extreme weather.
        if (objectDate.getHours() === 0 && objectDate.getMinutes() >= 0 && objectDate.getMinutes() < 15) {
          dayPredictArgo.dayPredictArgo(id, latitude, longitude, 1);
          const emerg = kpEmergency(id).then((d) => {
            Console.log('d is', d);
            return d;
          });
          Console.log('gogo');
          if (actions === null) {
            Console.log('emegererere ', emerg);
            return emerg;
          }
        }
        return actions;
      })
      .then((forecastAction) => {
        Console.log('forecastAction is ', forecastAction);
        const sense = PiInfo.findOne({ id }).exec();
        return sense.then((senseData) => {
          const premsg = { action: [] };
          const defaultAction = management.manageTemperature(
            temperature, senseData.tempMin, senseData.tempMax,
          );
          defaultAction.delay = '0/0/0';
          premsg.action.push(defaultAction);
          if (forecastAction !== null) {
            forecastAction.forEach((action) => {
              const newAction = action;
              const totalTime = Math.abs(newDate - new Date(action.delay)) / 1000;
              const hour = parseInt(totalTime / 3600, 10);
              const min = parseInt((totalTime % 3600) / 60, 10);
              const sec = parseInt(totalTime % 60, 10);
              const newTime = `${hour}/${min}/${sec}`;
              newAction.delay = newTime;
              premsg.action.push(newAction);
            });
          }
          return premsg;
        });
      })
      .then((msg) => {
        res.send(msg);
        // make Message
        const stringMsg = JSON.stringify(msg);
        PiMessage.create({ id, message: stringMsg }, (msgError, d) => {
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

router.get('/showmsg', (req, res) => {
  PiMessage.find({}).exec((err, messages) => {
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
