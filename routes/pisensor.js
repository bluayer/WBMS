const express = require('express');
const axios = require('axios');
const cron = require('node-cron');

const PiSensor = require('../models/PiSensor');
const PiEmerg = require('../models/PiEmerg');
const calcBatteryRemain = require('../public/javascript/calcBatteryRemain');

const dayPredictArgo = require('../public/javascript/dayPredictArgo');
const disconnectedSituation = require('../public/javascript/disconnectedSituation');

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
async function kpLoad(dailyKps, dailyKpMax) {
  return new Promise((resolve) => {
    findMaxValue(dailyKps, dailyKpMax).then((Max) => {
      Console.log(`Max value : ${Max}`);
      resolve(Max);
    });
  });
}


// KP 비교 이후 discon sit 호출
cron.schedule('0,10,20,30,40,50 * * * * *', async () => {
  const kpjson = await axios.get('https://fya10l15m8.execute-api.us-east-1.amazonaws.com/Stage');
  const dailyKps = await kpjson.data.breakdown;
  const dailyKpMax = -1;
  await kpLoad(dailyKps, dailyKpMax).then(async (Max) => {
  // 만약 waggle sensor가 견딜 수 있는 kp 지수가 kp-max보다 낮다면
  // 5일치 배터리 보호 plan을 세워서 보내줘야함
    await Console.log(Max);
    await PiSensor.find({}).exec(async (err, sensors) => {
      if (err) {
        Console.log(err);
      }
      const waggleNum = sensors.length;

      let i = 0;
      while (i < waggleNum) {
        if (sensors[i].kpMax <= dailyKpMax) {
          // await Console.log('disconnection!');
          // await disconnectedSituation(sensors[i].id, sensors[i].latitude, sensors[i].longitude, sensors[i].tempMin, sensors[i].tempMax);
          PiEmerg.update({ id: sensors[i].id }, { $set: { kpEmerg: true } });
        } else {
          // await Console.log(sensors[i].kpMax);
          // await Console.log('disconnection!');
          PiEmerg.update({ id: sensors[i].id }, { $set: { kpEmerg: false } });
        }
        i += 1;
      }
    });
  });
});


// GET '/pisensor'
// Just render test.ejs
router.get('/sensor', (req, res) => {
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
    id, temperature, voltage, latitude, longitude, kpMax,
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
  piSensor.kpMax = kpMax;
  // If you want to convert local server time, don't use toUTCString()
  // piSensor.date = new Date(date).toUTCString();


  // 배터리 잔량을 이용하여 batteryEmerg 값을 갱신한다
  if (batteryRemain <= 15) {
    disconnectedSituation.disconnectedSituation(id, latitude, longitude, tempMin, tempMax);
    PiEmerg.update({ id }, { $set: { batteryEmerg: true } });
    Console.log("battery Emerg!!!");
  } else {
    PiEmerg.update({ id }, { $set: { batteryEmerg: false } });
    Console.log("battery!!!");
  }

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

  if (piSensor.date.getHours() === 0) {
    dayPredictArgo.dayPredictArgo(id, latitude, longitude);
  }
});

// GET '/pisensor/pilocation'
// Just render test.ejs
router.get('/pilocation', (req, res) => {
  res.send(getPiLocation());
});


module.exports = router;
