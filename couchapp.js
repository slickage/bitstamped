var couchapp = require('couchapp'),
    path = require('path');

ddoc = {
  _id: '_design/bitstamped',
  views: {},
  lists: {},
  shows: {} 
}

module.exports = ddoc;

ddoc.views.tickerByTime = {
  map: function(doc) {
    if (doc.type === 'tickerdata')
      emit(doc.created, doc);
  }
}
