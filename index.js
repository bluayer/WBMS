var express = require('express');
var app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { title: 'The index page!' })
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});