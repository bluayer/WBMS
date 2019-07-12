const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
var bodyParser = require("body-parser");

const app = express();

// Set env values.
require('dotenv').config();

// Set DB

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO);
var db = mongoose.connection;
db.once("open", function(){
  console.log("DB connected");
});
db.on("error", function(err){
  console.log("DB ERROR : ", err);
});

// YOU SHOULD ADD MODEL AFTER CONNECTING DB
// It's very important.
let sensor = require('./models/Sensor');

// Set view engine
app.set('view engine', 'ejs');

// Set for static file
app.use(express.static(__dirname+"/public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// Set routes
app.use("/", require("./routes/home"));
app.use("/sensor", require("./routes/sensor"));

// App listening
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});