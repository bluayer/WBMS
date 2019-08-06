const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
// const schedule = require('node-schedule');
const PiSensor = require('../models/PiSensor');
const PiEmerg = require('../models/PiEmerg');
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
cron.schedule('15,30,45,00 * * * * *', async () => {
  const kpjson = await axios.get('https://fya10l15m8.execute-api.us-east-1.amazonaws.com/Stage');
  const kpdata = await kpjson.data;
  const dailyKps = await kpdata.breakdown;
  const dailyKpMax = -1;
  await kpLoad(dailyKps, dailyKpMax).then(async () => {
  // 만약 waggle sensor가 견딜 수 있는 kp 지수가 kp-max보다 낮다면
  // 3일치 배터리 보호 plan을 세워서 보내줘야함
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
          PiEmerg.update({ id }, { kpEmerg: true });
        } else {
          PiEmerg.update({ id }, { kpEmerg: false });
        }
        i += 1;
      }
    });
  });
});


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
  const message = { action: null };

  const {
    id, temperature, voltage, latitude, longitude, date,
  } = req.body;

  const batteryRemain = calcBatteryRemain(voltage);
  const objectDate = new Date(date);
  const options = { upsert: true, new: true };

  // 아이디 조회한뒤
  if (batteryRemain <= 15) {
    disconnectedSituation.disconnectedSituation(
      id, latitude, longitude, tempMin, tempMax,
    ).then((actions) => {
      if (actions.length) {
        message.action = actions;
      }
    });

    PiEmerg.findOneAndUpdate({ id }, { batteryEmerg: true }, options)
      .exec((err, data) => {
        if (err) {
          Console.log(err);
        }
        Console.log(data);
      });
  } else {
    PiEmerg.findOneAndUpdate({ id }, { batteryEmerg: false }, options)
      .exec((err, data) => {
        if (err) {
          Console.log(err);
        }
        Console.log(data);
      });
  }

  PiSensor.create({
    id, temperature, batteryRemain, latitude, longitude, tempMin, tempMax, date: objectDate,
  }, (err, data) => {
    if (err) {
      Console.error(err);
    } else {
      Console.log('Pi Sensor Save okay');
      Console.log(data);
    }
  });

  // set tempMin, tempMax if it's extreme weather.
  if (objectDate.getUTCHours() === 0) {
    await dayPredictArgo.dayPredictArgo(id, objectDate, latitude, longitude);
  }
  // when data come, return action
  const temp = await PiSensor.findOne({ date: objectDate }).exec();
  await Console.log(management.manageTemperature(temperature, temp.tempMin, temp.tempMax));
  // message function으로 변환 필요

  const stringMsg = JSON.stringify(message);
  PiMessage.create({ id, message: stringMsg }, (err, data) => {
    if (err) {
      Console.error(err);
    } else {
      Console.log('Pi Msg Save okay');
      Console.log(data);
    }
  });

  return res.json(message);
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
