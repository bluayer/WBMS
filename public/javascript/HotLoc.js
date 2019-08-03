const Console = console;

const HotLoc = (apiData) => {
  // 외부온도 기반으로 패키지 온도 예측 배열 생성
  const todayTData = [];
  todayTData[0] = (apiData[0].main.temp - 273);
  for (let i = 0; i < 7; i += 1) {
    const inclination = apiData[i + 1].main.temp - apiData[i].main.temp;
    if (inclination > 0) { // 기울기가 양수
      todayTData[i + 1] = todayTData[i] + (Math.abs(inclination) + 1);
      Console.log('todayTData :', todayTData[i + 1]);
      Console.log('apiData :', apiData[i + 1].main.temp);
    } else if (inclination < 0) { // 기울기가 음수
      todayTData[i + 1] = todayTData[i] - (Math.abs(inclination) + 1);
    } else { // 기울기가 0
      todayTData[i + 1] = todayTData[i];
    }
  }

  // tempMax 정하기
  let hotTempMax = 30;
  let inclinationMax = todayTData[1] - todayTData[0];
  for (let i = 1; i < 7; i += 1) {
    if (inclinationMax < (todayTData[i + 1] - todayTData[i])) {
      inclinationMax = (todayTData[i + 1] - todayTData[i]);
      hotTempMax = todayTData[i];
    }
  }
  return hotTempMax;
};

module.exports = { HotLoc };
