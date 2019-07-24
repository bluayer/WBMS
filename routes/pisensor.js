const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
// const schedule = require('node-schedule');
const PiSensor = require('../models/PiSensor');
const calcBatteryRemain = require('../public/javascript/calcBatteryRemain');
const management = require('../public/javascript/management');
const dayPredictArgo = require('../public/javascript/dayPredictArgo');

const Console = console;
const router = express.Router();
const piLocation = [['123423', 40.425869, -86.908066], ['123413', 40.416702, -86.875290]];

const chkUniquePiId = (id) => {
  for (let i = 0; i < piLocation.length; i += 1) {
    if (piLocation[i][0] === id.toString()) {
      return false; // Not unique
    }
  }
  return true; // Unique
};

const getPiLocation = () => piLocation;

const setPiLocation = (id, lat, lon) => {
  const temp = [id.toString(), lat, lon];
  piLocation.push(temp);
};

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
function kpLoad(dailyKps, dailyKpMax) {
  return new Promise((resolve) => {
    findMaxValue(dailyKps, dailyKpMax).then((Max) => {
      Console.log(`Max value : ${Max}`);
      resolve(Max);
    });
  });
}


// KP 비교 이후 discon sit 호출
cron.schedule('5,10,15,20,25,30,35,40,45,50,55 * * * * *', async () => {
  const kpjson = await axios.get('https://fya10l15m8.execute-api.us-east-1.amazonaws.com/Stage');
  const kpdata = await kpjson.data;
  const dailyKps = await kpdata.breakdown;
  const dailyKpMax = -1;
  kpLoad(dailyKps, dailyKpMax).then((Max) => {
  // 만약 waggle sensor가 견딜 수 있는 kp 지수가 kp-max보다 낮다면
  // 3일치 배터리 보호 plan을 세워서 보내줘야함
    Console.log(Max);
  // let i = 0;
  // PiSensor.find({}).exec((
  // err, sensors) => {
  //   if (err) {
  //     Console.log(err);
  //   }
  //   const waggleNum = 4;
  //   while (i < waggleNum) { // num 미정
  //     if (sensors[i].kpMax < dailyKpMax) {
  //       // disconnected_situation 호출
  //     }
  //     i += 1;
  //   }
  // });
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
router.post('/', (req, res) => {
  // Console.log(req.body);

  const tempMin = 0;
  const tempMax = 40;
  const {
    id, temperature, voltage, latitude, longitude, date,
  } = req.body;

  const batteryRemain = calcBatteryRemain(voltage);
  const piSensor = new PiSensor();

  piSensor.id = id;
  piSensor.temperature = temperature;
  piSensor.batteryRemain = batteryRemain;
  piSensor.latitude = latitude;
  piSensor.longitude = longitude;
  piSensor.tempMin = tempMin;
  piSensor.tempMax = tempMax;
  piSensor.date = new Date(date);

  piSensor.save((err) => {
    if (err) {
      Console.error(err);
    } else {
      Console.log('Save okay');
      if (chkUniquePiId(id) === true) {
        setPiLocation(id, latitude, longitude);
        Console.log('Set pi Location');
      }
    }
  });

  // 하루마다 알고리즘 부르기
  if (piSensor.date.getHours() === 0) {
    dayPredictArgo.dayPredictArgo(id, latitude, longitude);
  }

  res.json(management.makeMessage(temperature, tempMin, tempMax, batteryRemain));
});

// GET '/pisensor/pilocation'
// Just render test.ejs
router.get('/pilocation', (req, res) => {
  res.send(getPiLocation());
});

module.exports = router;
