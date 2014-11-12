'use strict';

var testConfigurationDAO = require('./testConfiguration');
var testDAO = require('./test');
var _ = require('lodash');

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

            if (params.type === 'complete') {
              var deployment = data;
              _.assign(params, {branch: deployment.branch});
              testConfigurationDAO.findByBranch(params, function(err, data) {
                if (err) {
                  callback(err, null);
                }

                var tests = [];
                data.forEach(function (element) {
                  element.suites.forEach(function (suite) {
                    tests.push({
                      buildId: deployment.buildId,
                      deploymentId: deployment._id,
                      module: suite.module,
                      suite: suite.suite,
                      queued: new Date(),
                      status: 'queued'
                    });
                  });
                });

                _.assign(params, {
                  insert: tests
                });
                testDAO.insert(params, function (err) {
                  if (err) {
                    callback(err, null);
                  }

                  callback(null, deployment);
                });
              });
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

//var deploymentDAO = new DeploymentDAO();
//module.exports = deploymentDAO;
module.exports = DeploymentDAO;
