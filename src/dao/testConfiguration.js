'use strict';

function TestConfigurationDAO(){};
TestConfigurationDAO.prototype = (function() {

  return {
    find: function find(params, callback) {
      var db = params.db;
      db.collection('testConfiguration')
        .find(params.query)
        .sort(params.sort)
        .toArray(callback);
    }
  };

})();

var testConfigurationDAO = new TestConfigurationDAO();
module.exports = testConfigurationDAO;
