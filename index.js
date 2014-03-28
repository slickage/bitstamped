var request = require('request');
var nano = require('nano')('http://localhost:5984');
var path = require('path');
var express = require('express');
var app = express();
app.set('view engine', 'ejs');
app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

var db = undefined;
nano.db.create('bitstamped', function(err, body) {
  if (!err) console.log('Database created.');
  db = nano.db.use('bitstamped');
});

var interval = 5000;

var requestBitstampData = function() {
  request('https://www.bitstamp.net/api/ticker/', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var tickerData = JSON.parse(body);
      Object.keys(tickerData).forEach(function(key) {
        tickerData[key] = Number(tickerData[key]);
      });
      tickerData.type = 'tickerdata';
      tickerData.created = new Date().getTime();
      db.insert(tickerData);
    }
  });
};

setInterval(requestBitstampData, interval);

var index = function(app) {
  app.get('/api/ticker/:timestamp', function(req, res) { 
    var timestamp = req.params.timestamp;
    db.view('bitstamped', 'tickerByTime', { limit: 10, descending: true, startkey: 0, endkey: timestamp }, function(err, body) {
      if (!err) {
        res.json(body.rows);
      }
    }); 
  });
};

index(app);
app.listen(3001);
module.exports = index;