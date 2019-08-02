const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
// const schedule = require('node-schedule');
const PiSensor = require('../models/PiSensor');
const PiEmerg = require('../models/PiEmerg');
const calcBatteryRemain = require('../public/javascript/calcBatteryRemain');
// const management = require('../public/javascript/management');
const dayPredictArgo = require('../public/javascript/dayPredictArgo');
const disconnectedSituation = require('../public/javascript/disconnectedSituation');

const Console = console;
const router = express.Router();

const piLocation = [];

const makeOnePiId = (arr) => {
  const data = [];
  arr.forEach((item) => {
    data.push(item.id);
  });
  return data;
};

const getPiIds = () => {
  const promise = PiEmerg.find({}).exec();
  return promise.then(res => makeOnePiId(res));
};

const makeOnePiLocation = (id, latitude, longitude, temperature, batteryRemain) => [id.toString(), latitude, longitude, temperature, batteryRemain];

const getOnePiLocation = (id) => {
  const promise = PiSensor.findOne({ id }).sort({ date: -1 }).exec();
  return promise.then(res => makeOnePiLocation(res.id, res.latitude, res.longitude, res.temperature, res.batteryRemain));
};

const makePiLocations = (piIds) => {
  const locations = [];
  piIds.forEach((piId) => {
    locations.push(getOnePiLocation(piId));
  });
  return locations;
};

const getPiLocations = piIds => Promise.all(makePiLocations(piIds))
  .then(piLocations => piLocations);

const loadPiLocations = () => getPiIds().then(piIds => getPiLocations(piIds))
  .then(piLocations => piLocations);

const chkUniquePiId = (id) => {
  for (let i = 0; i < piLocation.length; i += 1) {
    if (piLocation[i][0] === id.toString()) {
      return false; // Not unique
    }
  }
  return true; // Unique
};

const setPiLocation = (id, lat, lon) => {
  const temp = [id.toString(), lat, lon];
  piLocation.push(temp);
};

const getPiTempRemain = () => piTempRemain;

const setPiTempRemain = (id, temperature, remain) => {
  const temp = [id.toString(), temperature, remain];
  piTempRemain.push(temp);
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
      // Console.log(`Max value : ${Max}`);
      resolve(Max);
    });
  });
}


// KP 비교 이후 discon sit 호출
cron.schedule('15,30,45,00 * * * * *', async () => {
  const kpjson = await axios.get('https://fya10l15m8.execute-api.us-east-1.amazonaws.com/Stage');
  const kpdata = await kpjson.data;
  const dailyKps = await kpdata.breakdown;
  const dailyKpMax = -1;
  await kpLoad(dailyKps, dailyKpMax).then(async (Max) => {
  // 만약 waggle sensor가 견딜 수 있는 kp 지수가 kp-max보다 낮다면
  // 3일치 배터리 보호 plan을 세워서 보내줘야함
    // await Console.log(Max);
    await PiSensor.find({}).exec(async (err, sensors) => {
      if (err) {
        Console.log(err);
      }
      const waggleNum = sensors.length;
      // **************이 부분 나중에 while loop 안으로 꼭 넣어줘야함!!!*********************
      // await disconnectedSituation.disconnectedSituation(sensors[0].id, sensors[0].latitude, sensors[0].longitude, sensors[0].tempMin, sensors[0].tempMax);

      let i = 0;
      while (i < waggleNum) { // num 미정
        if (sensors[i].kpMax <= dailyKpMax) {
          await disconnectedSituation.disconnectedSituation(sensors[i].id, sensors[i].latitude, sensors[i].longitude, sensors[i].tempMin, sensors[i].tempMax);
          PiEmerg.update({ id: sensors[i].id }, { $set: { kpEmerg: true } });
        } else {
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
  // If you want to convert local server time, don't use toUTCString()
  piSensor.date = new Date(date).toUTCString();


  // 아이디 조회한뒤
  if (batteryRemain <= 15) {
    disconnectedSituation.disconnectedSituation(id, latitude, longitude, tempMin, tempMax);
    PiEmerg.update({ id }, { $set: { batteryEmerg: true } });
  } else {
    PiEmerg.update({ id }, { $set: { batteryEmerg: false } });
  }

  piSensor.save((err) => {
    if (err) {
      Console.error(err);
    } else {
      Console.log('Save okay');
      if (chkUniquePiId(id) === true) {
        setPiLocation(id, latitude, longitude);
        setPiTempRemain(id, temperature, batteryRemain);
        Console.log('Set pi Location');
        Console.log('Set pi Temperature, batteryRemain');
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
  loadPiLocations().then((d) => {
    // Console.log(d);
    res.send(d);
  });
});

module.exports = router;
