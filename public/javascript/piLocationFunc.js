const PiEmerg = require('../../models/PiEmerg');
const PiSensor = require('../../models/PiSensor');

const makeOnePiId = (arr) => {
  const data = [];
  arr.forEach((item) => {
    data.push(item.id);
  });
  return data;
};

const getPiIds = () => {
  const promise = PiEmerg.find({}).exec();
  return promise.then(res => makeOnePiId(res));
};

const makeOnePiLocation = (
  id, latitude, longitude, temperature, batteryRemain,
) => [id.toString(), latitude, longitude, temperature, batteryRemain];

const getOnePiLocation = (piId) => {
  const promise = PiSensor.findOne({ id: piId }).sort({ date: -1 }).exec();
  return promise.then((res) => {
    const {
      id, latitude, longitude, temperature, batteryRemain,
    } = res;

    return makeOnePiLocation(id, latitude, longitude, temperature, batteryRemain);
  });
};

const makePiLocations = (piIds) => {
  const locations = [];
  piIds.forEach((piId) => {
    locations.push(getOnePiLocation(piId));
    console.log(locations);
  });
  return locations;
};

const getPiLocations = piIds => Promise.all(makePiLocations(piIds))
  .then(piLocations => piLocations);

module.exports = { getPiIds, getPiLocations };
