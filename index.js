var express = require('express');
var path = require('path');
var app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { title: 'The index page!' })
});

app.get('/statistic', (req, res) => {
  res.render('statistic', { title: 'Statistic '})
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});