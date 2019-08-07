const Console = console;

const coldLoc = (tempMin, todayPackT) => {
  // set tempMin
  let coldTempMin = tempMin;
  let inclinationMax = todayPackT[1] - todayPackT[0];
  for (let i = 1; i < 7; i += 1) {
    if (inclinationMax > todayPackT[i + 1] - todayPackT[i]) {
      inclinationMax = todayPackT[i + 1] - todayPackT[i];
      coldTempMin = todayPackT[i];
    } else {
      coldTempMin = todayPackT[0];
    }
  }
  Console.log(coldTempMin);
  return coldTempMin;
};

module.exports = { coldLoc };
