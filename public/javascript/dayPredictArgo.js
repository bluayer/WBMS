const axios = require('axios');

const PiInfo = require('../../models/PiInfo');
const hotLoc = require('./hotLoc');
const coldLoc = require('./coldLoc');

const Console = console;

const temperatureArr = [];
// 외부온도 기반으로 패키지 온도 예측 배열 생성
const createPackT = (tempArr, positiveInclination, nagativeInclination) => {
  const positiveI = positiveInclination;
  const nagativeI = nagativeInclination;
  
  const PackT = [];
  PackT[0] = tempArr[0];
  for (let i = 0; i < tempArr.length; i += 1) {
    const inclination = tempArr[i + 1] - tempArr[i];
    if (inclination > 0) { // 기울기가 양수
      PackT[i + 1] = PackT[i] + (Math.abs(inclination) + positiveI).toFixed(3);
    } else if (inclination < 0) { // 기울기가 음수
      PackT[i + 1] = PackT[i] - (Math.abs(inclination) + nagativeI).toFixed(3);
    } else { // 기울기가 0
      PackT[i + 1] = PackT[i];
    }
  }

  return PackT;
};

const dayPredictArgo = async (id, latitude, longitude) => {
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
  for (let i = 0; i < apiData.length; i += 1) {
    temperatureArr[i] = (apiData[i].main.temp - 273).toFixed(3);
    weather[i] = apiData[i].weather[0].main;
  }

  // 하루 최고, 최저 기온
  const todayT = [];
  let todayTMax = temperatureArr[0];
  let todayTMin = temperatureArr[0];
  for (let i = 1; i < 8; i += 1) {
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
      const hotpackT = createPackT(todayT, 0.9, 0.5);
      await PiInfo.findOneAndUpdate({ id }, {
        tempMax: hotLoc.hotLoc(temp.tempMax, hotpackT, weather),
      }, { new: true });
    } else if (todayTMin < 5) { // ColdLoc strategy
      const coldpackT = createPackT(todayT, 0.03, 0.08);
      await PiInfo.findOneAndUpdate({ id }, {
        tempMin: coldLoc.coldLoc(temp.tempMin, coldpackT),
      }, { new: true });
    }
  } else { // 일교차가 큰 경우
    // management.manageTemperature(temp.temperature, temp.tempMax, temp.tempMin);
  }
  // const dateAPI = await new Date(apiData[0].dt_txt);
  // await Console.log(date);
};

const getPackageTArr = (id, latitude, longitude) => {
  dayPredictArgo(id, latitude, longitude);
  return createPackT(temperatureArr, 0.2, 0.2);
};

module.exports = { dayPredictArgo };
