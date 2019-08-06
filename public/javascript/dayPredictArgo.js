const axios = require('axios');

const PiSensor = require('../../models/PiSensor');
const hotLoc = require('./hotLoc');
const coldLoc = require('./coldLoc');

const Console = console;

const dayPredictArgo = async (id, objectDate, latitude, longitude) => {
  const lat = latitude;
  const lon = longitude;

  const temp = await PiSensor.findOne().sort({ date: -1 }).exec();

  const url = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&APPID=${process.env.OWM_API}`;
  let apiData = [];
  try {
    const response = await axios.get(url);
    apiData = await response.data.list;
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
  if ((todayTMax - todayTMin) < 15) { // 일교차 작은경우
    if (todayTMax > 30) { // HOT strategy
      await PiSensor.findOneAndUpdate({ id, date: objectDate }, { tempMax: hotLoc.hotLoc(temp.tempMax, todayT, weather) }, { new: true });
    } else if (todayTMin < 5) { // ColdLoc strategy
      await PiSensor.findOneAndUpdate({ id, date: objectDate }, { tempMin: coldLoc.coldLoc(temp.tempMin, todayT) }, { new: true });
    }
  } else { // 일교차가 큰 경우
    // management.manageTemperature(temp.temperature, temp.tempMax, temp.tempMin);
  }
  // const dateAPI = await new Date(apiData[0].dt_txt);
  // await Console.log(date);
};

module.exports = { dayPredictArgo };
