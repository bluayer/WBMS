const coldLoc = (tempMin, packT) => {
  // set tempMin
  let coldTempMin = tempMin;
  let inclinationMax = (packT[1] - packT[0]).toFixed(3);
  for (let i = 1; i < 7; i += 1) {
    if (inclinationMax > (packT[i + 1] - packT[i]).toFixed(3)) {
      inclinationMax = (packT[i + 1] - packT[i]).toFixed(3);
      coldTempMin = packT[i];
    }
  }
  return coldTempMin;
};

module.exports = { coldLoc };
