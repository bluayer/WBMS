const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
// const schedule = require('node-schedule');
const PiSensor = require('../models/PiSensor');
const calcBatteryRemain = require('../public/javascript/calcBatteryRemain');
const management = require('../public/javascript/management');

const Console = console;
const router = express.Router();

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

// POST '/sensor'
// Save data at DB
router.post('/', (req, res) => {
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
    }
  });

  if (piSensor.date.getHours() === 0){
    const lat = latitude;
    const lon = longitude;
    const url = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&APPID=${process.env.OWM_API}`;
    let apiData = [];
    try {
      const response = await axios.get(url);
      apiData = await response.data.list;
      await Console.log(apiData);
    } catch (err) {
      await Console.error(err);
    }
    // 하루 최고, 최저 기온
    const todayTMax = apiData[0]
    const todayTMin = apiData[0];
    for(let i = 0; i<8 ;i++){
      if(apiData[i] > apiData[i+1]){
        todayTMax = apiData[i];
      }
      else{
        todayTMax = apiData[i+1];
      }
    }
    for(let i = 0; i<8 ;i++){
      if(apiData[i] < apiData[i+1]){
        todayTMin = apiData[i];
      }
      else{
        todayTMin = apiData[i+1];
      }
    }
    
    // 일교차
    if( 15 > (todayTMax-todayTMin)){
      //hot
      if ( todayTMax > 40 ){
        //HotLoc();
      }
      //cold
      else if ( todayTMin < 5 ){
        //ColdLoc();
      }
      //default
      else {
        management.manageTemperature(temperature, tempMax, tempMin);
      }
    }
    else {
      //평균온도로 유지하기
    }
    

    const date = await new Date(apiData[0].dt_txt);
    await Console.log(date);
  }

  res.json(management.makeMessage(temperature, tempMin, tempMax, batteryRemain));
});

module.exports = router;
