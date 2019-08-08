const axios = require('axios');

const PiInfo = require('../../models/PiInfo');
const hotLoc = require('./hotLoc');
const coldLoc = require('./coldLoc');

const Console = console;

const dayPredictArgo = async (id, latitude, longitude, day) => {
  const lat = latitude;
  const lon = longitude;
  const days = day * 8;

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
  for (let i = (days - 8); i < days; i += 1) {
    todayT[i] = temperatureArr[i];
    if (todayTMax < todayT[i]) {
      todayTMax = todayT[i];
    }
    if (todayTMin > todayT[i]) {
      todayTMin = todayT[i];
    }
  }
  // 외부온도 기반으로 패키지 온도 예측 배열 생성
  const PackT = [];
  PackT[0] = todayT[0];
  for (let i = 0; i < todayT.length; i += 1) {
    const inclination = (todayT[i + 1] - todayT[i]).toFixed(3);
    if (inclination > 0) { // 기울기가 양수
      PackT[i + 1] = (parseFloat(PackT[i]) + (Math.abs(inclination) + 0.9)).toFixed(3);
    } else if (inclination < 0) { // 기울기가 음수
      PackT[i + 1] = (parseFloat(PackT[i]) - (Math.abs(inclination) + 0.3)).toFixed(3);
    } else { // 기울기가 0
      PackT[i + 1] = parseFloat(PackT[i]).toFixed;
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
  }
  return PackT;
  // const dateAPI = await new Date(apiData[0].dt_txt);
  // await Console.log(date);
};

module.exports = { dayPredictArgo };
