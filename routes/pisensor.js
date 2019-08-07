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

function findMaxValue(dailyKps, dailyKpMax) {
  return new Promise((resolve) => {
    let Max = dailyKpMax;
    for (let i = 0; i < dailyKps.length; i += 3) {
      if (dailyKps[i].kp > Max) {
        Max = dailyKps[i].kp;
      }
    }
    resolve(Max);
  });
}

// api를 통해서 하루의 kp 정보를 가져오고, kp-max를 찾아서 반환하는 함수
async function kpLoad(dailyKps, dailyKpMax) {
  return new Promise((resolve) => {
    findMaxValue(dailyKps, dailyKpMax).then((Max) => {
      // Console.log(`Max value : ${Max}`);
      resolve(Max);
    });
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
cron.schedule('0,10,20,30,40,50 * * * * *', async () => {
  const kpjson = await axios.get('https://fya10l15m8.execute-api.us-east-1.amazonaws.com/Stage');
  const dailyKps = await kpjson.data.breakdown;
  const dailyKpMax = -1;
  await kpLoad(dailyKps, dailyKpMax).then(async () => {
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
            .exec((queryErr, data) => {
              if (err) {
                Console.log(queryErr);
              }
              // Console.log(data);
            });
        } else {
          PiInfo.findOneAndUpdate({ id }, { kpEmerg: false }, options)
            .exec((queryErr, data) => {
              if (err) {
                Console.log(queryErr);
              }
              // Console.log(data);
            });
        }
        i += 1;
      }
    });
  });
});

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

const formatingMsg = (actions) => {
  const message = {};
  message.action = actions;

  return message;
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
  let message = { action: null };

  const {
    id, temperature, voltage, latitude, longitude, kpMax, date,
  } = req.body;

  const batteryRemain = await calcBatteryRemain(voltage);
  const objectDate = new Date(date);
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
    chkDisconnectedSituation(batteryRemain, id, latitude, longitude, tempMin, tempMax)
      .then(actions => formatingMsg(actions))
      .then((msg) => {
        // make Message
        message = msg;
        res.send(message);
        const stringMsg = JSON.stringify(msg);
        PiMessage.create({ id, message: stringMsg }, (msgError, d) => {
          if (msgError) {
            Console.error(msgError);
          } else {
            Console.log('Pi Msg Save okay');
            Console.log(d);
          }
        });
      });

    // set tempMin, tempMax if it's extreme weather.
    if (objectDate.getUTCHours() === 0) {
      dayPredictArgo.dayPredictArgo(id, objectDate, latitude, longitude, 1);
    }

    const temp = PiSensor.findOne({ date: objectDate }).exec();
    Console.log(management.manageTemperature(temperature, temp.tempMin, temp.tempMax));
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

  // when data come, return action
  // const temp = await PiSensor.findOne({ date: objectDate }).exec();
  // await Console.log(management.manageTemperature(temperature, temp.tempMin, temp.tempMax));
  // message function으로 변환 필요

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
