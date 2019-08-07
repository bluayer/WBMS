const Console = console;

const hotLoc = (tempMax, todayPackT, weather) => {
  // if it will rain, return default tempMax
  for (let i = 0; i < 8; i += 1) {
    if (weather[i] === 'Rain') {
      return tempMax;
    }
  }

  // set tempMax
  let hotTempMax = tempMax;
  let inclinationMax = todayPackT[1] - todayPackT[0];
  for (let i = 1; i < 7; i += 1) {
    if (inclinationMax < todayPackT[i + 1] - todayPackT[i]) {
      inclinationMax = todayPackT[i + 1] - todayPackT[i];
      hotTempMax = todayPackT[i];
    }
  }
  return hotTempMax;
};

module.exports = { hotLoc };
