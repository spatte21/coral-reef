'use strict';

var _ = require('lodash');
var dataConfigurationDAO = require('./dataConfiguration');
var deploymentDAO = require('./deployment');
var testConfigurationDAO = require('./testConfiguration');

function BuildDAO(){};
BuildDAO.prototype = (function() {

  return {
    findById: function findById(params, callback) {
      var db = params.db;
      db.collection('builds')
        .findOne({_id: new params.ObjectID(params.id)}, callback);
    },

    find: function find(params, callback) {
      var db = params.db;
      db.collection('builds')
        .find(params.query)
        .sort(params.sort)
        .toArray(callback);
    },

    insert: function insert(params, callback) {
      var db = params.db;
      db.collection('builds')
        .insert(params.insert, function (err, data) {
          if (err) {
            callback(err, null);
          }

          var build = _.first(data);

          // we only need to proceed with a queued deployment if there are tests configured for this branch
          testConfigurationDAO.findByBranch(params, function(err, data) {

            if (err) {
              callback(err, null);
            }
            else if (!!data && data.length > 0) {
              _.assign(params, {
                query: { branch: {$in: [params.branch, 'default']} },
                sort: {}
              });

              dataConfigurationDAO.find(params, function(err, data) {
                if (err) {
                  callback(err, null);
                }

                var snapshot = _.find(data, {branch: params.branch});
                if (!snapshot) {
                  snapshot = _.find(data, {branch: 'default'});
                }

                _.assign(params, {
                  insert: {
                    buildId: params.buildId,
                    branch: params.branch,
                    queued: new Date(),
                    snapshotName: snapshot.snapshotName,
                    snapshotFile: snapshot.snapshotFile,
                    status: 'queued'
                  }
                });

                deploymentDAO.insert(params, function(err, data) {
                  if (err) {
                    callback(err, null);
                  }

                  build.deployments = data;
                  callback(null, build);
                });
              });
            }
            else {
              callback(null, build);
            }
          })
        });
    }
  };
})();

var buildDAO = new BuildDAO();
module.exports = buildDAO;
