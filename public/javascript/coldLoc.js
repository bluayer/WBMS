const Console = console;

const coldLoc = (tempMin, todayT) => {
  // 외부온도 기반으로 패키지 온도 예측 배열 생성
  const todayPackT = [];
  todayPackT[0] = todayT[0];
  for (let i = 0; i < 7; i += 1) {
    const inclination = todayT[i + 1] - todayT[i];
    if (inclination > 0) { // 기울기가 양수
      todayPackT[i + 1] = todayPackT[i] + (Math.abs(inclination) + 0.03);
    } else if (inclination < 0) { // 기울기가 음수
      todayPackT[i + 1] = todayPackT[i] - (Math.abs(inclination) + 0.08);
    } else { // 기울기가 0
      todayPackT[i + 1] = todayPackT[i];
    }
  }

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
