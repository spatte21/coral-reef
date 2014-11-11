'use strict';

var DataConfigurationDAO(){};
DataConfigurationDAO.prototype = (function() {

  findByBranch: function findByBranch(params, callback) {
    var branch = params.branch;
    var db = params.db;
    
    db.collection('dataConfiguration').find({branch:{$in:[branch,'default']}}).toArray(callback);
  }

})();

var dataConfigurationDAO = new DataConfigurationDAO();
module.exports = dataConfigurationDAO;
