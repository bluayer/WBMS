const axios = require('axios');
const fs = require('fs');
const management = require('./management');

const Console = console;


const disconnectedSituation = async (id, latitude, longitude) => {
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
      const tmpArr = [];
      const tmpData = apiDataSet[i].main;
      tmpArr.push(tmpData.temp);
      tmpArr.push(tmpData.temp_min);
      tmpArr.push(tmpData.temp_max);
      fiveDayData.push(tmpArr);
    }
    // management 함수 호출 한 후, 동작(T/F)를 json 형태로 저장
    const jsonContent = [];
    for (let i = 0; i < len; i += 1) {
      const tmp = fiveDayData[i];
      const data = management.manageTemperature(tmp[0], tmp[1], tmp[2]);
      jsonContent.push(data);
    }
    // JSON file 만들기
    Console.log(jsonContent);
    const json = JSON.parse(jsonContent);
    const data = JSON.stringify(json);
    fs.writeFile('disconnectPlan.json', data, (err) => {
      if (err) {
        return Console.error(err);
      }
      return Console.log('JSON File saved successfully!');
    });
  } catch (err) {
    await Console.error(err);
  }

  // // 일교차
  // if ((todayTMax - todayTMin) < 15) {
  //   if (todayTMax > 40) { // HOT strategy
  //     // HotLoc();
  //   } else if (todayTMin < 5) { // COLD strategy
  //     // ColdLoc();
  //   } else { // DEFAULT strategy
  //     // management.manageTemperature(temperature, tempMax, tempMin);
  //   }
  // } else {
  //   // 평균온도로 유지하기
  // }
  // // const dateAPI = await new Date(apiData[0].dt_txt);
  // // await Console.log(date);
};

module.exports = { disconnectedSituation };
