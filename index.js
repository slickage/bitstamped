var request = require('request');
var nano = require('nano')('http://localhost:5984');
var path = require('path');
var express = require('express');
var app = express();
app.use(express.bodyParser());

var db = undefined;
nano.db.create('bitstamped', function(err, body) {
  if (!err) console.log('Database created.');
  db = nano.db.use('bitstamped');
});

var interval = 1000 * 60;

var requestBitstampData = function() {
  request('https://www.bitstamp.net/api/ticker/', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var tickerData = JSON.parse(body);
      Object.keys(tickerData).forEach(function(key) {
        tickerData[key] = Number(tickerData[key]);
      });
      tickerData.type = 'tickerdata';
      db.insert(tickerData);
    }
  });
};

setInterval(requestBitstampData, interval);

var index = function(app) {
  app.get('/api/ticker/:timestamp', function(req, res) { 
    var timestamp = Number(req.params.timestamp)/1000;
    var params = { limit:1, descending: true, startkey: timestamp };
    db.view('bitstamped', 'tickerByTime', params, function(err, body) {      
      if (!err) {
        res.json(body.rows);
      }
    }); 
  });
};

index(app);
app.listen(3000);
module.exports = index;