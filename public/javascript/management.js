const manageTemperature = (T, tMin, tMax) => {
  // True : On fan
  // False : Off fan
  const data = { fan: false, heater: false };
  if (T > tMax) {
    data.fan = true;
  }

  if (T < tMin) {
    data.heater = true;
  }

  return data;
};

const manageBatteryRemain = (batteryRemain) => {
  // Battery should be charged at usual
  // True : Do charge
  // False : Not charge
  const data = { charge: true };
  // If BatteryRemain > 90, it can be overcharged.
  // So stop charge.
  if (batteryRemain > 90) {
    data.charge = false;
  }

  return data;
};

const makeMessage = (T, tMin, tMax, batteryRemain) => {
  const data = {};
  const tempData = manageTemperature(T, tMin, tMax);
  const batteryData = manageBatteryRemain(batteryRemain);
  data.fan = tempData.fan;
  data.heater = tempData.heater;
  data.charge = batteryData.charge;
  return data;
};

module.exports = { manageTemperature, manageBatteryRemain, makeMessage };
