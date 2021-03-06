const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

const Console = console;
const port = process.env.PORT || 3000;

// Set env values.
require('dotenv').config();

// Set DB
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO, { useNewUrlParser: true });
mongoose.set('useFindAndModify', false);
const db = mongoose.connection;
db.once('open', () => {
  Console.log('DB connected');
});
db.on('error', (err) => {
  Console.log('DB ERROR : ', err);
});

// Set view engine
app.set('view engine', 'ejs');

// Set for static file
app.use(express.static(`${__dirname}/public`));

// Set bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set routes
app.use('/', require('./routes/home'));
app.use('/pisensor', require('./routes/pisensor'));
app.use('/piinfo', require('./routes/piinfo'));

// App listening
app.listen(port, () => {
  Console.log(`Example app listening on ${port}!`);
});
