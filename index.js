var request = require('request');
var nano = require('nano')('http://localhost:5984');

var db = undefined;
nano.db.create('bitstamped', function(err, body) {
  if (!err)
    console.log('Database created.');
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
      db.insert(tickerData);
      console.log(tickerData);
    }
  });
};

setInterval(requestBitstampData, interval);

