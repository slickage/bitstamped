var request = require('request');
var nano = require('nano')('http://localhost:5984');
// var express = require('express');
// var bodyParser = require('body-parser');
// var app = express();
var couchapp = require('couchapp');
var ddoc = require('./couchapp');
var dbName = 'bitstamped';
// app.use(bodyParser());
var db;

function requestBitstampData() {
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
}

var getTicker = function(timestamp, cb) {
  timestamp = Number(timestamp) / 1000; // discard milliseconds
  db.view('bitstamped', 'tickerByTime', { limit: 1, descending: true, startkey: timestamp }, cb);
};

// var routes = function(app) {
//   app.get('/api/ticker/:timestamp', function(req, res) {
//     getTicker(req.params.timestamp, function(err, body) {
//       if (!err) {
//         res.json(body.rows[0]);
//         res.end();
//       }
//       else {
//         res.json({ error: err });
//         res.end();
//       }
//     });
//   });
// };

 var init = function(dbRootUrl, interval) {
    dbRootUrl = dbRootUrl || 'http://localhost:5984';
    var reqInterval = interval || 1000 * 60;
    nano.db.get(dbName, function(err) {
    if (err) {
      nano.db.create(dbName, function(err) {
        if (err) {
          console.log(err);
          return process.exit(1);
        }
        db = nano.use(dbName);
        couchapp.createApp(ddoc, dbRootUrl + dbName, function(app) {
          app.push();
          setInterval(requestBitstampData, reqInterval);
        });
      });
    }
    else {
      db = nano.use(dbName);
      setInterval(requestBitstampData, reqInterval);
    }
  });
};

module.exports = {
  init: init,
//  routes: routes,
  getTicker: getTicker
 };