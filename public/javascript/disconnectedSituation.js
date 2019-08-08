const dayPredictArgo = require('./dayPredictArgo');
const management = require('./management');
const PiInfo = require('../../models/PiInfo');

const Console = console;


const disconnectedSituation = async (id, latitude, longitude) => {
  let res = [];
  const jsonContent = [];
  for (let i = 0; i < 5; i += 1) {
    const packageTemp = dayPredictArgo.dayPredictArgo(id, latitude, longitude, i + 1);
    PiInfo.find({ id }).exec((err, packageData) => {
      for (let j = 0; j < 8; j += 1) {
        const data = management.manageTemperature(packageTemp[j], packageData.tempMin, packageData.tempMax);
        jsonContent.push(data);
      }
    });
  }
  Console.log(jsonContent);

  res = jsonContent;
  return res;
};

module.exports = { disconnectedSituation };
