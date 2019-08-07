const axios = require('axios');

const PiInfo = require('../../models/PiInfo');
const hotLoc = require('./hotLoc');
const coldLoc = require('./coldLoc');

const Console = console;

const packageTArr = [];

const dayPredictArgo = async (id, latitude, longitude, day) => {
  const lat = latitude;
  const lon = longitude;

  const temp = await PiInfo.findOne({ id }).exec();

  const url = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&APPID=${process.env.OWM_API}`;
  let apiData = [];
  try {
    const response = await axios.get(url);
    apiData = await response.data.list;
  } catch (err) {
    await Console.error(err);
  }
  // temperatureArr is apiData.main.temp array
  const weather = [];
  const temperatureArr = [];
  for (let i = 0; i < apiData.length; i += 1) {
    temperatureArr[i] = (apiData[i].main.temp - 273).toFixed(3);
    weather[i] = apiData[i].weather[0].main;
  }

  // 하루 최고, 최저 기온
  const todayT = [];
  let todayTMax = temperatureArr[0];
  let todayTMin = temperatureArr[0];
  for (let i = (day - 1); i < (day + 7); i += 1) {
    todayT[i] = temperatureArr[i];
    if (todayTMax < todayT[i]) {
      todayTMax = todayT[i];
    }
    if (todayTMin > todayT[i]) {
      todayTMin = todayT[i];
    }
  }

  // 일교차로 먼저 분류
  if ((todayTMax - todayTMin) < 15) { // 일교차 작은경우
    if (todayTMax > 20) { // HOT strategy
      await PiInfo.findOneAndUpdate({ id }, {
        tempMax: hotLoc.hotLoc(temp.tempMax, todayT, weather),
      }, { new: true });
    } else if (todayTMin < 5) { // ColdLoc strategy
      await PiInfo.findOneAndUpdate({ id }, {
        tempMin: coldLoc.coldLoc(temp.tempMin, todayT),
      }, { new: true });
    }
  } else { // 일교차가 큰 경우
    // management.manageTemperature(temp.temperature, temp.tempMax, temp.tempMin);
  }
  // const dateAPI = await new Date(apiData[0].dt_txt);
  // await Console.log(date);
};

const getPackageTArr = (id, latitude, longitude, day) => {
  dayPredictArgo(id, latitude, longitude, day);
  return packageTArr;
};
const setPackageTArr = (packT) => {
  packageTArr.push(packT);
};
module.exports = { dayPredictArgo, getPackageTArr, setPackageTArr };
