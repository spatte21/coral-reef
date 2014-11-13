'use strict';

function DeploymentDAO(){};
DeploymentDAO.prototype = (function() {

  return {

    findById: function findById(params, callback) {
      var db = params.db;
      db.collection('deployments')
        .findOne({_id: new params.ObjectID(params.id)}, callback);
    },

    find: function find(params, callback) {
      var db = params.db;
      db.collection('deployments')
        .find(params.query)
        .sort(params.sort)
        .toArray(callback);
    },

    findFirst: function findFirst(params, callback) {
      var db = params.db;
      db.collection('deployments')
        .find(params.query, {limit:1})
        .sort(params.sort)
        .toArray(callback);
    },

    update: function update(params, callback) {
      var db = params.db;
      db.collection('deployments')
        .findAndModify(
          params.query,
          params.sort,
          {$set: params.update},
          {'new': true},
          function(err, data) {
            if (err) {
              callback(err, null);
            }
            else {
              callback(null, data);
            }
          });
    },

    insert: function insert(params, callback) {
      var db = params.db;
      db.collection('deployments')
        .insert(params.insert, callback);
    }
  };

})();

var deploymentDAO = new DeploymentDAO();
module.exports = deploymentDAO;
