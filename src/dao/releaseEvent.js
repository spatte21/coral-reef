'use strict';

function ReleaseEventDAO(){};
ReleaseEventDAO.prototype = (function() {

  return {
    find: function find(params, callback) {
      var db = params.db;
      db.collection('releaseEvents')
        .find(params.query)
        .sort(params.sort)
        .toArray(callback);
    }
  };

})();

var releaseEventDAO = new ReleaseEventDAO();
module.exports = releaseEventDAO;
