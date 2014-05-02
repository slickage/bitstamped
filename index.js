var request = require('request');
var nano = require('nano')('http://localhost:5984');
var express = require('express');
var app = express();
var couchapp = require('couchapp');
var ddoc = require('./couchapp');
var dbName = 'bitstamped';
app.use(express.bodyParser());

var db;
nano.db.get(dbName, function(err) {
  if (err) {
    nano.db.create(dbName, function(err) {
      if (err) {
        return process.exit(1);
      }
      db = nano.use(dbName);
      var dbUrl = 'http://localhost:5984/' + dbName;
      couchapp.createApp(ddoc, dbUrl, function(app) {
        app.push();
      });
    });
  }
  else {
    db = nano.use(dbName);
  }
});

var requestBitstampData = function() {
  request('https://www.bitstamp.net/api/ticker/', function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var tickerData = JSON.parse(body);
      Object.keys(tickerData).forEach(function(key) {
        tickerData[key] = Number(tickerData[key]);
      });
      tickerData.type = 'tickerdata';
      db.insert(tickerData);
    }
  });
};

var interval = 1000 * 60;

setInterval(requestBitstampData, interval);

var getTicker = function(timestamp, cb) {
  timestamp = Number(timestamp) / 1000; // discard milliseconds
  db.view('bitstamped', 'tickerByTime', { limit: 1, descending: true, startkey: timestamp }, cb);
};

var routes = function(app) {
  app.get('/api/ticker/:timestamp', function(req, res) {
    getTicker(req.params.timestamp, function(err, body) {
      if (!err) {
        res.json(body.rows[0]);
        res.end();
      }
      else {
        res.json({ error: err });
        res.end();
      }
    });
  });
};

module.exports = {
  routes: routes,
  getTicker: getTicker
 };