const express = require('express');
const axios = require('axios');

const router = express.Router();
const Console = console;

// GET '/api/'
// render showApi.ejs
router.get('/', async (req, res) => {
  const lat = 40.123;
  const lon = -15.123;
  const url = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&APPID=${process.env.OWM_API}`;
  let apiData = [];
  try {
    const response = await axios.get(url);
    apiData = await response.data.list;
  } catch (err) {
    await Console.error(err);
  }
  // lat, lon으로 표준 시간대를 찾고
  // 표준 시간대 적용

  // const date = await new Date(apiData[0].dt_txt);
  // await Console.log(date);
  await res.render('showApi', { apiData });
});


module.exports = router;
