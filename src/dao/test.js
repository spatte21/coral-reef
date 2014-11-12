'use strict';

var _ = require('lodash');
var DeploymentDAO = require('./deployment');
var deploymentDAO = new DeploymentDAO();

_.forIn(deploymentDAO, function(v,k) {
  console.log(k);
});

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
            params.id = test.deploymentId;
            deploymentDAO.findById(params, function (err, data) {
              if (err) {
                callback (err, null);
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
            params.id = test.deploymentId;
            require('./deployment').findById(params, function (err, data) {
              if (err) {
                callback (err, null);
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
      var me = this;
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

            var test = data;
            if (!!test) {

              if (params.type === 'complete') {
                _.assign(params, {
                  query: {buildId: test.buildId, status: {$ne: 'complete'}},
                  sort: {}
                });
                me.find(params, function(err, data) {
                  if (data.length === 0) {
                    _.assign(params, {
                      type: 'finished',
                      query: {_id: new params.ObjectID(test.deploymentId)},
                      sort: [],
                      update: {environmentStatus: 'finished'}
                    });

                    require('./deployment').update(params, function(err) {
                      callback(err, test);
                    });
                  }
                  else {
                    callback(err, test);
                  }
                });
              }
              else {
                params.id = test.deploymentId;
                require('./deployment').findById(params, function (err, data) {
                  if (err) {
                    callback(err, null);
                  }

                  test.deployment = data;
                  callback(null, test);
                });
              }
            }
            else {
              callback(null, test);
            }
          });
    }
  };

})();

var testDAO = new TestDAO();
module.exports = testDAO;
