const axios = require('axios');

const Console = console;

const disconnectedSituation = async (id, latitude, longitude) => {
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
  let todayTMax = apiData[0];
  let todayTMin = apiData[0];
  for (let i = 0; i < 5; i += 1) {
    for (let j = 0; j < 8; j += 1) {
      if (apiData[j].main.temp > apiData[j + 1].main.temp) {
        todayTMax = apiData[j].main.temp;
      } else {
        todayTMax = apiData[j + 1].main.temp;
      }
    }
    for (let j = 0; j < 8; j += 1) {
      if (apiData[i].temp < apiData[i + 1].main.temp) {
        todayTMin = apiData[i].main.temp;
      } else {
        todayTMin = apiData[i + 1].main.temp;
      }
    }
  }

  // 일교차
  if ((todayTMax - todayTMin) < 15) {
    if (todayTMax > 40) { // HOT strategy
      // HotLoc();
    } else if (todayTMin < 5) { // COLD strategy
      // ColdLoc();
    } else { // DEFAULT strategy
      // management.manageTemperature(temperature, tempMax, tempMin);
    }
  } else {
    // 평균온도로 유지하기
  }
  // const dateAPI = await new Date(apiData[0].dt_txt);
  // await Console.log(date);
};

module.exports = { disconnectedSituation };