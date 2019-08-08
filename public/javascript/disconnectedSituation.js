const management = require('./management');
const dayPredictArgo = require('./dayPredictArgo');

const Console = console;


const disconnectedSituation = async (id, latitude, longitude, tMin, tMax) => {
  let res = [];
  const jsonContent = [];
  for (let i = 0; i < 5; i += 1) {
    const packageTemp = dayPredictArgo.getPackageTArr(id, latitude, longitude, i + 1);
    for (let j = 0; j < 8; j += 1) {
      const data = management.manageTemperature(packageTemp[j], tMin, tMax);
      jsonContent.push(data);
    }
  }
  Console.log(jsonContent);
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
  return res;
  // 프론트에 전송
};

module.exports = { disconnectedSituation };
