const PiInfo = require('../../models/PiInfo');
const PiSensor = require('../../models/PiSensor');

const Console = console;

const makeOnePiId = (arr) => {
  const data = [];
  arr.forEach((item) => {
    data.push(item.id);
  });
  return data;
};

const getPiIds = () => {
  const promise = PiInfo.find({}).exec();
  return promise.then(res => makeOnePiId(res));
};

const makeOnePiLocation = (
  id, latitude, longitude, temperature, batteryRemain,
) => [id.toString(), latitude, longitude, temperature, batteryRemain];

const getInfo = (piId) => {
  const info = PiInfo.findOne({ id: piId }).exec();

  return info.then(res => res);
};

const getSense = (piId) => {
  const sense = PiSensor.findOne({ id: piId }).sort({ date: -1 }).exec();

  return sense.then(res => res);
};


const getOnePiLocation = async (piId) => {
  const { id, latitude, longitude } = await getInfo(piId);
  const { temperature, batteryRemain } = await getSense(piId);

  return makeOnePiLocation(id, latitude, longitude, temperature, batteryRemain);
};

const makePiLocations = (piIds) => {
  const locations = [];
  piIds.forEach((piId) => {
    locations.push(getOnePiLocation(piId));
    Console.log(locations);
  });
  return locations;
};

const getPiLocations = piIds => Promise.all(makePiLocations(piIds))
  .then(piLocations => piLocations);

module.exports = { getPiIds, getPiLocations };
