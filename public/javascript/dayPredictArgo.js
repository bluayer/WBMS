const axios = require('axios');

const PiInfo = require('../../models/PiInfo');
const hotLoc = require('./hotLoc');
const coldLoc = require('./coldLoc');

const Console = console;

const createPackT = (todayT, positiveI, negativeI) => {
  // 외부온도 기반으로 패키지 온도 예측 배열 생성
  const packT = [];
  const firstTodayT = Number(todayT[0]);
  packT[0] = firstTodayT;
  for (let i = 0; i < todayT.length - 1; i += 1) {
    const inclination = Number((todayT[i + 1] - todayT[i]).toFixed(3));
    if (inclination > 0) { // 기울기가 양수
      packT[i + 1] = Number((packT[i] + (Math.abs(inclination) + positiveI)).toFixed(3));
    } else if (inclination < 0) { // 기울기가 음수
      packT[i + 1] = Number((packT[i] - (Math.abs(inclination) + negativeI)).toFixed(3));
    } else { // 기울기가 0
      packT[i + 1] = Number(packT[i]);
    }
  }
  return packT;
};

const dayPredictArgo = async (id, latitude, longitude, day) => {
  const lat = latitude;
  const lon = longitude;
  const days = (day - 1) * 8;

  const daysPackT = [];

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
  // 하루 최고, 최저 기온
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
  // 일교차로 먼저 분류
  if ((todayTMax - todayTMin) < 15) { // 일교차 작은경우
    if (todayTMax > 20) { // HOT strategy
      daysPackT.push(createPackT(todayT, 0.9, 0.3));
      await PiInfo.findOneAndUpdate({ id }, {
        tempMax: hotLoc.hotLoc(temp.tempMax, createPackT(todayT, 0.9, 0.3), weather),
      }, { new: true });
    } else if (todayTMin < 5) { // ColdLoc strategy
      daysPackT.push(createPackT(todayT, 0.03, 0.08));
      await PiInfo.findOneAndUpdate({ id }, {
        tempMin: coldLoc.coldLoc(temp.tempMin, createPackT(todayT, 0.03, 0.08)),
      }, { new: true });
    }
  }
  // packT+date Array
  for (let i = 0; i < 8; i += 1) {
    daysPackT[0][i] += (`/${dateArr[days + i]}`);
  }
  return daysPackT;
  // const dateAPI = await new Date(apiData[0].dt_txt);
  // await Console.log(date);
};

module.exports = { dayPredictArgo };
