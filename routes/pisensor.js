const express = require('express');
const axios = require('axios');
const cron = require('node-cron');

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

const disconnectedSituationAction = async (sensor) => {
  const {
    id, latitude, longitude, tempMin, tempMax,
  } = sensor;
  const data = await disconnectedSituation.disconnectedSituation(
    id, latitude, longitude, tempMin, tempMax,
  );
  // *** send Actions to raspberry pi ***
  // await Console.log(typeof data);
  // await Console.log(data);
  return data;
};

// KP 비교 이후 discon sit 호출
const kpEmergency = async () => {
  const kpjson = await axios.get('https://fya10l15m8.execute-api.us-east-1.amazonaws.com/Stage');
  const dailyKps = await kpjson.data.breakdown;
  await kpLoad(dailyKps).then(async (dailyKpMax) => {
    // Console.log(dailyKpMax);
    // 만약 waggle sensor가 견딜 수 있는 kp 지수가 kp-max보다 낮다면
    // 3일치 배터리 보호 plan을 세워서 보내줘야함
    const options = { upsert: true, new: true };
    await PiSensor.find({}).exec(async (err, sensors) => {
      if (err) {
        Console.log(err);
      }
      const waggleNum = sensors.length;

      let i = 0;
      while (i < waggleNum) { // num 미정
        const { kpMax, id } = sensors[i];
        if (kpMax <= dailyKpMax) {
          disconnectedSituationAction(sensors[i]);
          // If there's actions,
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
        i += 1;
      }
    });
  });
};

const chkDisconnectedSituation = async (
  batteryRemain, id, latitude, longitude, tempMin, tempMax,
) => {
  let response = null;
  if (batteryRemain <= 15) {
    response = await disconnectedSituation.disconnectedSituation(
      id, latitude, longitude, tempMin, tempMax,
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
    chkDisconnectedSituation(
      batteryRemain, id, latitude, longitude, tempMin, tempMax,
    )
      .then((actions) => {
        // set tempMin, tempMax if it's extreme weather.
        if (objectDate.getHours() === 0) {
          dayPredictArgo.dayPredictArgo(id, latitude, longitude, 1);
        }
        return actions;
      })
      .then((forecastAction) => {
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

    // 00시 ~ 01시 15분 간에 도착하는 post 에 대해서 kp emergy function 실행
    if (objectDate.getUTCMinutes() > 00 && objectDate.getUTCMinutes() < 15 && objectDate.getUTCHours() === 0) {
      kpEmergency();
    }
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
