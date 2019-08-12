const hotLoc = (tempMax, packT, weather) => {
  // if it will rain, return default tempMax
  for (let i = 0; i < 8; i += 1) {
    if (weather[i] === 'Rain') {
      return tempMax;
    }
  }
  // set tempMax
  let hotTempMax = tempMax;
  let inclinationMax = (packT[1] - packT[0]).toFixed(3);
  for (let i = 1; i < 8; i += 1) {
    if (inclinationMax < (packT[i + 1] - packT[i]).toFixed(3)) {
      inclinationMax = (packT[i + 1] - packT[i]).toFixed(3);
      hotTempMax = packT[i];
    }
  }
  if (hotTempMax > tempMax) {
    hotTempMax = tempMax;
  }
  return hotTempMax;
};

module.exports = { hotLoc };
