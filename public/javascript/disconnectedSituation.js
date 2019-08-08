const dayPredictArgo = require('./dayPredictArgo');
const management = require('./management');
const PiInfo = require('../../models/PiInfo');

const Console = console;


const disconnectedSituation = (id, latitude, longitude) => {
  const jsonContent = [];
  for (let i = 0; i < 5; i += 1) {
    const packageTemp = dayPredictArgo.dayPredictArgo(id, latitude, longitude, i + 1);
    PiInfo.find({ id }).exec((err, packageData) => {
      Console.log('packageData.tempMax: ', packageData[0].tempMax);
      for (let j = 0; j < 8; j += 1) {
        const data = management.manageTemperature(
          packageTemp[j], packageData[0].tempMin, packageData[0].tempMax,
        );
        jsonContent.push(data);
      }
    });
  }
  Console.log(jsonContent);

  return jsonContent;
};

module.exports = { disconnectedSituation };
