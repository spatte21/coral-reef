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
    },

    findByBranch: function findByBranch(params, callback) {
      var db = params.db;
      db.collection('testConfiguration')
        .find({})
        .toArray(function(err, data) {
          if (err) {
            callback(err, null);
          }
          else {
            var testConfigs = [];
            data.forEach(function (element) {
              if (params.branch.indexOf(element.branch) >= 0) {
                testConfigs.push(element);
              }
            });
            callback(null, testConfigs);
          }
        });
    }
  };

})();

var testConfigurationDAO = new TestConfigurationDAO();
module.exports = testConfigurationDAO;
