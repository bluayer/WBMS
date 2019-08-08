const Console = console;

const hotLoc = (tempMax, PackT, weather) => {
  // if it will rain, return default tempMax
  for (let i = 0; i < 8; i += 1) {
    if (weather[i] === 'Rain') {
      return tempMax;
    }
  }
  // set tempMax
  let hotTempMax = tempMax;
  let inclinationMax = (PackT[1] - PackT[0]).toFixed(3);
  for (let i = 1; i < 7; i += 1) {
    if (inclinationMax < (PackT[i + 1] - PackT[i]).toFixed(3)) {
      inclinationMax = (PackT[i + 1] - PackT[i]).toFixed(3);
      hotTempMax = PackT[i];
    }
  }
  return hotTempMax;
};

module.exports = { hotLoc };
