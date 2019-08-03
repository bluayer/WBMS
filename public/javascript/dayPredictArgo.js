const axios = require('axios');

const PiSensor = require('../../models/PiSensor');
const management = require('./management');
const HotLoc = require('./HotLoc');

const Console = console;

const dayPredictArgo = async (id, latitude, longitude) => {
  const lat = latitude;
  const lon = longitude;
  const piSensor = new PiSensor();

  const temp = piSensor.products.findOne({ id: id.toString() });

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
  let todayTMax = apiData[0];
  let todayTMin = apiData[0];
  for (let i = 0; i < 8; i += 1) {
    if (apiData[i].main.temp > apiData[i + 1].main.temp) {
      todayTMax = (apiData[i].main.temp - 273);
    } else {
      todayTMax = (apiData[i + 1].main.temp - 273);
    }
  }
  for (let i = 0; i < 8; i += 1) {
    if (apiData[i].temp < apiData[i + 1].main.temp) {
      todayTMin = (apiData[i].main.temp - 273);
    } else {
      todayTMin = (apiData[i + 1].main.temp - 273);
    }
  }

  // 일교차로 먼저 분류
  if ((todayTMax - todayTMin) < 15) { // 일교차 작은경우
    if (todayTMax > 30) { // HOT strategy
      management.manageTemperature(temp.temperature, HotLoc.HotLoc(apiData), temp.tempMin);
    } else if (todayTMin < 5) { // ColdLoc strategy
      // ColdLoc();
    } else { // DEFAULT strategy
      management.manageTemperature(temp.temperature, temp.tempMax, temp.tempMin);
    }
  } else { // 일교차가 큰 경우
    // 평균온도로 유지하기
  }
  // const dateAPI = await new Date(apiData[0].dt_txt);
  // await Console.log(date);
};

module.exports = { dayPredictArgo };
