const axios = require('axios');
const fs = require('fs');
const management = require('./management');

const Console = console;


const disconnectedSituation = async (latitude, longitude, tMin, tMax) => {
  const lat = latitude;
  const lon = longitude;
  const url = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&APPID=${process.env.OWM_API}`;
  let apiDataSet = [];
  const fiveDayData = [];
  try {
    const response = await axios.get(url);
    apiDataSet = await response.data.list;
    const len = apiDataSet.length;
    // 3시간 간격으로 5일치 temparature 정보를 가져와서 fiveDayData배열에 담는다.
    for (let i = 0; i < len; i += 1) {
      fiveDayData.push(apiDataSet[i].main.temp);
    }
    // management 함수 호출 한 후, 동작(T/F)를 json 형태로 저장
    const jsonContent = [];
    for (let i = 0; i < len; i += 1) {
      const data = management.manageTemperature(fiveDayData[i] - 273, tMin, tMax);
      jsonContent.push(data);
    }
    // JSON file 만들기
    Console.log(jsonContent);
    const data = JSON.stringify(jsonContent);
    fs.writeFile('disconnectPlan.json', data, (err) => {
      if (err) {
        return Console.error(err);
      }
      return Console.log('JSON File saved successfully!');
    });
  } catch (err) {
    await Console.error(err);
  }
};

module.exports = { disconnectedSituation };
