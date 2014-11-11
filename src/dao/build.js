'use strict';

var _ = require('lodash');

var BuildDAO(){};

BuildDAO.prototype = (function() {

  findOne: function findOne(params, callback) {
    var db = params.db;
    var query = params.query;
    var build;

    db.collection('builds').findOne(query, function(err, result) {
      if (err) {
        callback(err, null);
      }

      build = result;
      db.collection('deployments').find({buildId: build.buildId}).sort({'queued': 1}).toArray(function(err, result) {
        if (err) {
          callback(err, null);
        }

        build.deployments = result;
        db.collection('testResults').find({buildId: buildId}).sort({module: 1, suite: 1}).toArray(function(err, result) {
          if (err) {
            callback(err, null);
          }

          build.tests = result;
          callback(null, build);
        });
      })
    });
  },

  find: function find(params, callback) {
    var db = params.db;
    var query = params.query;
    var sort = params.sort;

    db.collection('builds').find(query).sort(sort).toArray(callback);
  },

  insert: function insert(params, callback) {
    var db = params.db;
    var build = {
      buildId: params.buildId,
      branch: params.branch,
      startTime: new Date()
    };

    db.collection('builds').insert(build, function(err, result) {
      if (err) {
        callback(err, null);
      }

      db.collection('dataConfiguration').find({branch:{$in:[params.branch,'default']}}).toArray(function(err, result) {
        if (err) {
          callback(err, null);
        }

        var snapshot = _.find(result, {branch: params.branch});
        if (!snapshot) {
          snapshot = _.find(result, {branch: 'default'});
        }

        var deployment = {
          buildId: params.buildId,
          branch: params.branch,
          queued: new Date(),
          snapshotName: snapshot.snapshotName,
          snapshotFile: snapshot.snapshotFile,
          status: 'queued'
        };

        db.collection('deployments').insert(deployment, function(err, result) {
          if (err) {
            callback(err, null);
          }

          build.deployment = result;
          callback(null, build);
        });
      });

    });
  }

})();

var buildDAO = new BuildDAO();
module.exports = buildDAO;
