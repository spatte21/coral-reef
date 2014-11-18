'use strict';

function DeploymentDAO(){};
DeploymentDAO.prototype = (function() {

  return {

    findById: function findById(params, callback) {
      var db = params.db;
      db.collection('builds')
        .findOne({_id: new params.ObjectID(params.id)}, { buildId:1, branch:1, deployment:1 }, callback);
    },

    find: function find(params, callback) {
      var db = params.db;
      db.collection('builds')
        .find(params.query, {fields: { buildId:1, branch:1, deployment:1 }, sort: [[ 'deployment.queued',1 ]]})
        .toArray(callback);
    },

    findFirst: function findFirst(params, callback) {
      var db = params.db;
      db.collection('builds')
        .find(params.query, {fields: { buildId:1, branch:1, deployment:1 }, sort: [[ 'deployment.queued',1 ]], limit:1})
        .nextObject(callback);
    },

    update: function update(params, callback) {
      var db = params.db;
      db.collection('builds')
        .findAndModify(
          params.query,
          params.sort,
          params.update,
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
