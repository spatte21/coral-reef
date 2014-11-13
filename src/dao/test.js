'use strict';

var _ = require('lodash');

function TestDAO(){};
TestDAO.prototype = (function() {

  return {
    findById: function findById(params, callback) {
      var db = params.db;
      db.collection('testResults')
        .findOne({_id: new params.ObjectID(params.id)}, function(err, data) {
          if (err) {
            callback(err, null);
          }

          var test = data;
          if (!!test) {
            db.collection('deployments')
              .findOne({_id: new params.ObjectID(test.deploymentId)}, function (err, data) {
                if (err) {
                  callback(err, null);
                }

                test.deployment = data;
                callback(null, test);
              });
          }
          else {
            callback(null, test);
          }
        });
    },

    find: function find(params, callback) {
      var db = params.db;
      db.collection('testResults')
        .find(params.query)
        .sort(params.sort)
        .toArray(callback);
    },

    findFirst: function findFirst(params, callback) {
      var db = params.db;
      db.collection('testResults')
        .find(params.query, {limit:1})
        .sort(params.sort)
        .toArray(function(err, data) {
          if (err) {
            callback(err, null);
          }

          var test = _.first(data);
          if (!!test) {
            db.collection('deployments')
              .findOne({_id: new params.ObjectID(test.deploymentId)}, function (err, data) {
                if (err) {
                  callback(err, null);
                }

                test.deployment = data;
                callback(null, test);
              });
          }
          else {
            callback(null, test);
          }
        });
    },

    insert: function insert(params, callback) {
      var db = params.db;
      db.collection('testResults')
        .insert(params.insert, callback);
    },

    update: function update(params, callback) {
      var db = params.db;
      db.collection('testResults')
        .findAndModify(
          params.query,
          params.sort,
          {$set: params.update},
          {new: true},
          function(err, data) {
            if (err) {
              callback(err, null);
            }
            else {
              callback(null, data);
            }
          });
    }
  };

})();

var testDAO = new TestDAO();
module.exports = testDAO;
