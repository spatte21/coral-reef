'use strict';

var _ = require('lodash');

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
      var query = {};

      if (!!params.branch) {
        query.branch = params.branch;
      }

      if (!!params.buildId) {
        query.buildId = params.buildId;
      }

      _.assign(params, {
        query: query,
        sort: { startTime: 1 }
      });

      db.collection('builds')
        .find(query)
        .sort({startTime: -1})
        .toArray(function(err, data) {

          console.log('yo');
          var results = _.map(data, function(build) {
            return {
              _id: build._id,
              buildId: build.buildId,
              branch: build.branch,
              status: build.status,
              startTime: build.startTime,
              latestMessage: _.findLast(_.sortBy(build.messages, 'timestamp')),
              testResults: _.reduce(build.tests, function(result, test) {
                if (!!test.results && !!test.results.stats) {
                  result.tests += test.results.stats.tests;
                  result.passes += test.results.stats.passes;
                  result.failures += test.results.stats.failures;
                }
                return result;
              }, { tests: 0, passes: 0, failures: 0})
            };
          });
          console.log(results);

          callback(err, results);
        });
    },

    insert: function insert(params, callback) {
      var db = params.db;
      db.collection('builds')
        .insert(params.insert, callback);
    },

    remove: function remove(params, callback) {
      var db = params.db;
      db.collection('builds')
        .remove({_id: new params.ObjectID(params.id)}, {}, callback);
    }
  };
})();

var buildDAO = new BuildDAO();
module.exports = buildDAO;
