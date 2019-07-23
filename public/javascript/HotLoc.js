const management = require('./management');

const HotLoc = (currentT) => {
  // tempMin, tempMax 정하기
  const HotTempMin = 0;
  const HotTempMax = 30;
  management.manageTemperature(currentT, HotTempMax, HotTempMin);
};

module.exports = { HotLoc };
