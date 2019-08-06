const axios = require('axios');
const management = require('./management');

const Console = console;


const disconnectedSituation = async (id, latitude, longitude, tMin, tMax) => {
  const lat = latitude;
  const lon = longitude;
  const url = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&APPID=${process.env.OWM_API}`;
  let apiDataSet = [];
  const fiveDayData = [];
  const fiveDayDate = [];
  let res = [];
  try {
    const response = await axios.get(url);
    apiDataSet = await response.data.list;
    const len = apiDataSet.length;
    // Console.log(apiDataSet);
    // 3시간 간격으로 5일치 temparature 정보를 가져와서 fiveDayData배열에 담는다.
    for (let i = 0; i < len; i += 1) {
      fiveDayData.push(apiDataSet[i].main.temp);
      fiveDayDate.push(apiDataSet[i].dt_txt);
    }
    // management 함수 호출 한 후, 동작(T/F)를 json 형태로 저장
    const jsonContent = [];
    for (let i = 0; i < len; i += 1) {
      const data = management.manageTemperature(fiveDayData[i] - 273, tMin, tMax);
      data.date = fiveDayDate[i];
      jsonContent.push(data);
    }
    // JSON file 만들기
    // const data = JSON.stringify(jsonContent);
    // fs.writeFile('disconnectPlan.json', data, (err) => {
    //   Console.log(`Data is ${data}`);
    //   if (err) {
    //     Console.error(err);
    //   }
    //   Console.log('JSON File saved successfully!');
    // });
    res = jsonContent;
  } catch (err) {
    await Console.error(err);
  }
  // Console.log(res);
  return res;
  // 프론트에 전송
};

module.exports = { disconnectedSituation };
