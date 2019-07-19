// 전압과 전류로 배터리 남은 잔량 계산 후 리턴.

const CalcBatteryRemain = (voltage) => {
  let batteryRemain = 0;
  if (voltage > 13.7) {
    batteryRemain = 100;
  } else if (voltage > 13.3 && voltage <= 13.7) {
    batteryRemain = 97;
  } else if (voltage > 12.9 && voltage <= 13.3) {
    batteryRemain = 93;
  } else if (voltage > 12.8 && voltage <= 12.9) {
    batteryRemain = 90;
  } else if (voltage > 12.7 && voltage <= 12.8) {
    batteryRemain = 85;
  } else if (voltage > 12.6 && voltage <= 12.7) {
    batteryRemain = 84;
  } else if (voltage > 12.5 && voltage <= 12.6) {
    batteryRemain = 79;
  } else if (voltage > 12.4 && voltage <= 12.5) {
    batteryRemain = 68;
  } else if (voltage > 12.3 && voltage <= 12.4) {
    batteryRemain = 63;
  } else if (voltage > 12.2 && voltage <= 12.3) {
    batteryRemain = 57;
  } else if (voltage > 12.1 && voltage <= 12.2) {
    batteryRemain = 52;
  } else if (voltage > 12.0 && voltage <= 12.1) {
    batteryRemain = 47;
  } else if (voltage > 11.9 && voltage <= 12.0) {
    batteryRemain = 44;
  } else if (voltage > 11.8 && voltage <= 11.9) {
    batteryRemain = 41;
  } else if (voltage > 11.7 && voltage <= 11.8) {
    batteryRemain = 35;
  } else if (voltage > 11.6 && voltage <= 11.7) {
    batteryRemain = 31;
  } else if (voltage > 11.5 && voltage <= 11.6) {
    batteryRemain = 25;
  } else if (voltage > 11.4 && voltage <= 11.5) {
    batteryRemain = 17;
  } else if (voltage > 11.3 && voltage <= 11.4) {
    batteryRemain = 13;
  } else {
    batteryRemain = 0;
  }
  return batteryRemain;
};

module.exports = CalcBatteryRemain;
