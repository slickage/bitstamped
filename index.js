var request = require('request');
var express = require('express');
var api = express.Router();
var ddoc = require('./ddoc');
var dbName = 'bitstamped';
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

api.route('/bistamped/:timestamp').get(function(req, res) {
  getTicker(req.params.timestamp, function(err, body) {
    if (!err) {
      var tickerData = body.rows[0].value;
      delete tickerData._id;
      delete tickerData._rev;
      delete tickerData.type;
      res.json(tickerData);
      res.end();
    }
    else {
      res.json({ error: err });
      res.end();
    }
  });
});

 var init = function(dbRootUrl, interval) {
    dbRootUrl = dbRootUrl || 'http://localhost:5984';
    var nano = require('nano')(dbRootUrl);
    var reqInterval = interval || 1000 * 60;
    nano.db.get(dbName, function(err) {
    if (err) {
      nano.db.create(dbName, function(err) {
        if (err) {
          console.log('Error creating database\n' + err);
          return process.exit(1);
        }
        db = nano.use(dbName);
        db.insert(ddoc, function(err) {
          if (err) {
            console.log('Error pushing design document\n' + err);
            return process.exit(1);
          }
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
  api: api,
  getTicker: getTicker
 };