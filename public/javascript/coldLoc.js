const Console = console;
const dayPredictArgo = require('./dayPredictArgo');

const coldLoc = (tempMin, PackT) => {
  // set tempMin
  let coldTempMin = tempMin;
  let inclinationMax = (PackT[1] - PackT[0]).toFixed(3);
  for (let i = 1; i < 7; i += 1) {
    if (inclinationMax > (PackT[i + 1] - PackT[i]).toFixed(3)) {
      inclinationMax = (PackT[i + 1] - PackT[i]).toFixed(3);
      coldTempMin = PackT[i];
    }
  }
  return coldTempMin;
};

module.exports = { coldLoc };
