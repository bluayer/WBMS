const dayPredictArgo = require('./dayPredictArgo');
const management = require('./management');
const PiInfo = require('../../models/PiInfo');

const Console = console;

const getOneDayAction = (id, latitude, longitude, k) => {
  const oneDayAction = dayPredictArgo.dayPredictArgo(id, latitude, longitude, k)
    .then((packageTemp) => {
      const actionArray = PiInfo.find({ id }).exec().then((packageData) => {
        const res = [];
        for (let j = 0; j < 8; j += 1) {
          const temp = packageTemp[0][j].split('/');
          const temperature = Number(temp[0]);
          const date = temp[1];
          const data = management.manageTemperature(
            temperature, packageData[0].tempMin, packageData[0].tempMax,
          );
          // disconnected situation이면 무조건 충전
          data.charge = true;
          data.delay = date;
          res.push(data);
        }
        // 하루치 액션이 담긴 배열
        return res;
      }).then(response => response);

      return actionArray;
    }).then(arr => arr);

  return oneDayAction;
};

const getFiveDayAction = (id, latitude, longitude) => {
  const content = [];
  for (let i = 0; i < 5; i += 1) {
    content.push(getOneDayAction(id, latitude, longitude, i + 1)
      .then(actions => actions));
  }

  return Promise.all(content);
};

const disconnectedSituation = async (id, latitude, longitude) => {
  return getFiveDayAction(id, latitude, longitude).then((content) => {
    const data = [];
    content.forEach((oneDayAction) => {
      oneDayAction.forEach((action) => {
        data.push(action);
      });
    });

    return Promise.all(data);
  });
};

module.exports = { disconnectedSituation };
