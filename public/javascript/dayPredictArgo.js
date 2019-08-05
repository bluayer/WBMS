const axios = require('axios');

const PiSensor = require('../../models/PiSensor');
const management = require('./management');
const HotLoc = require('./HotLoc');

const Console = console;

const dayPredictArgo = async (id, latitude, longitude) => {
  const lat = latitude;
  const lon = longitude;

  const temp = await PiSensor.findOne({ id }).exec();

  const url = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&APPID=${process.env.OWM_API}`;
  let apiData = [];
  try {
    const response = await axios.get(url);
    apiData = await response.data.list;
    // await Console.log(apiData);
  } catch (err) {
    await Console.error(err);
  }
  // todayT is apiData.main.temp array
  const todayT = [];
  const weather = [];
  for (let i = 0; i < 8; i += 1) {
    todayT[i] = (apiData[i].main.temp - 273).toFixed(3);
    weather[i] = apiData[i].weather.main;
  }
  // 하루 최고, 최저 기온
  let todayTMax = todayT[0];
  let todayTMin = todayT[0];
  for (let i = 1; i < 8; i += 1) {
    if (todayTMax < todayT[i]) {
      todayTMax = todayT[i];
    }
    if (todayTMin > todayT[i]) {
      todayTMin = todayT[i];
    }
  }
  // 일교차로 먼저 분류
  let response = management.manageTemperature(temp.temperature, temp.tempMax, temp.tempMin);
  if ((todayTMax - todayTMin) < 15) { // 일교차 작은경우
    if (todayTMax > 24) { // HOT strategy
      response = management.manageTemperature(temp.temperature, HotLoc.HotLoc(temp.tempMax, todayT, weather), temp.tempMin);
    } else if (todayTMin < 5) { // ColdLoc strategy
      // ColdLoc();
    }
  } else { // 일교차가 큰 경우
    // management.manageTemperature(temp.temperature, temp.tempMax, temp.tempMin);
  }
  // const dateAPI = await new Date(apiData[0].dt_txt);
  // await Console.log(date);
  return response;
};

module.exports = { dayPredictArgo };
