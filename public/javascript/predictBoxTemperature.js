const axios = require('axios');

const PiInfo = require('../../models/PiInfo');
const hotLoc = require('./hotLoc');
const coldLoc = require('./coldLoc');

const Console = console;

const createBoxT = (todayT, positiveI, negativeI) => {
  // predict inside temperature of battery box by getting outside temperature
  const boxT = [];
  const firstTodayT = Number(todayT[0]);
  boxT[0] = firstTodayT;
  for (let i = 0; i < todayT.length - 1; i += 1) {
    const inclination = Number((todayT[i + 1] - todayT[i]).toFixed(3));
    if (inclination > 0) {
      boxT[i + 1] = Number((boxT[i] + (Math.abs(inclination) + positiveI)).toFixed(3));
    } else if (inclination < 0) {
      boxT[i + 1] = Number((boxT[i] - (Math.abs(inclination) + negativeI)).toFixed(3));
    } else {
      boxT[i + 1] = Number(boxT[i]);
    }
  }
  return boxT;
};

const predictBoxTemperature = async (id, latitude, longitude, day) => {
  const lat = latitude;
  const lon = longitude;
  const days = (day - 1) * 8;

  const daysBoxT = [];

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
  const dateArr = [];
  for (let i = 0; i < apiData.length; i += 1) {
    temperatureArr[i] = Number((apiData[i].main.temp - 273).toFixed(3));
    weather[i] = apiData[i].weather[0].main;
    dateArr[i] = apiData[i].dt_txt;
  }
  // the highs and lows today
  const todayT = [];
  let todayTMax = temperatureArr[days];
  let todayTMin = temperatureArr[days];
  for (let i = 0; i < 8; i += 1) {
    todayT[i] = temperatureArr[days + i];
    if (todayTMax < todayT[i]) {
      todayTMax = todayT[i];
    }
    if (todayTMin > todayT[i]) {
      todayTMin = todayT[i];
    }
  }
  // difference between the highs and lows today
  if ((todayTMax - todayTMin) < 10) { // small difference
    if (todayTMin > 28) { // HOT strategy
      const boxT = createBoxT(todayT, 2.2, 2.0);
      daysBoxT.push(boxT);
      await PiInfo.findOneAndUpdate({ id }, {
        tempMax: hotLoc.hotLoc(temp.tempMax, boxT, weather),
      }, { new: true });
    } else if (todayTMax < 8) { // ColdLoc strategy
      const boxT = createBoxT(todayT, 2.0, 2.2);
      daysBoxT.push(boxT);
      await PiInfo.findOneAndUpdate({ id }, {
        tempMin: coldLoc.coldLoc(temp.tempMin, boxT),
      }, { new: true });
    }
  }

  // boxT+date Array
  for (let i = 0; i < 8; i += 1) {
    daysBoxT[0][i] += (`/${dateArr[days + i]}`);
  }
  return daysBoxT;
};

module.exports = { predictBoxTemperature };
