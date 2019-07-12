var express = require('express');
var app = express();

// app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static("public"));

app.get('/', (req, res) => {
  res.render('main', { title: 'The index page!' })
});

app.get('/main', (req, res) => {
  res.render('main', { title: 'The index page!' })
});

app.get('/index', (req, res) => {
  res.render('index', { title: 'The index page!' })
});

app.get('/statistics', (req, res) => {
  res.render('statistics', { title: 'The index page!' })
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!!');
});