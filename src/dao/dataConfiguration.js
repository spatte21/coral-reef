'use strict';

function DataConfigurationDAO(){};
DataConfigurationDAO.prototype = (function() {

  return {

    find: function find(params, callback) {
      var db = params.db;
      db.collection('dataConfiguration')
        .find({ branch: {$in: [params.branch, 'default']} })
        .toArray(callback);
    }

  };

})();

var dataConfigurationDAO = new DataConfigurationDAO();
module.exports = dataConfigurationDAO;
