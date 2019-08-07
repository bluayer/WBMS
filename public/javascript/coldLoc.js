const Console = console;
const dayPredictArgo = require('./dayPredictArgo');

const coldLoc = (tempMin, todayT) => {
  // 외부온도 기반으로 패키지 온도 예측 배열 생성
  const PackT = [];
  PackT[0] = todayT[0];
  for (let i = 0; i < todayT.length; i += 1) {
    const inclination = todayT[i + 1] - todayT[i];
    if (inclination > 0) { // 기울기가 양수
      PackT[i + 1] = PackT[i] + (Math.abs(inclination) + 0.9).toFixed(3);
    } else if (inclination < 0) { // 기울기가 음수
      PackT[i + 1] = PackT[i] - (Math.abs(inclination) + 0.3).toFixed(3);
    } else { // 기울기가 0
      PackT[i + 1] = PackT[i];
    }
  }
  dayPredictArgo.setPackageTArr(PackT);
  // set tempMin
  let coldTempMin = tempMin;
  let inclinationMax = PackT[1] - PackT[0];
  for (let i = 1; i < 7; i += 1) {
    if (inclinationMax > PackT[i + 1] - PackT[i]) {
      inclinationMax = PackT[i + 1] - PackT[i];
      coldTempMin = PackT[i];
    } else {
      coldTempMin = PackT[0];
    }
  }
  Console.log(coldTempMin);
  return coldTempMin;
};

module.exports = { coldLoc };
