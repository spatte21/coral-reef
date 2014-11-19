'use strict';

var _ = require('lodash');

function TestDAO(){};
TestDAO.prototype = (function() {

  return {
    findById: function findById(params, callback) {
      var db = params.db;
      db.collection('builds')
        .aggregate([
          {$unwind: '$tests'},
          {$match: params.query}
        ], function(err, data) {
          callback(err, _.first(data));
        });
    },

    find: function find(params, callback) {
      var db = params.db;
      db.collection('builds')
        .aggregate([
          {$unwind: '$tests'},
          {$match: params.query},
          {$sort: params.sort}
        ], function(err, data) {
          callback(err, data);
        });
    },

    findFirst: function findFirst(params, callback) {
      var db = params.db;
      db.collection('builds')
        .aggregate([
          {$unwind: '$tests'},
          {$match: params.query},
          {$sort: params.sort}
        ], function(err, data) {
          callback(err, _.first(data));
        });
    },

    update: function update(params, callback) {
      var db = params.db;
      db.collection('builds')
        .findAndModify(
          params.query,
          params.sort,
          params.update,
          {new: true},
          function(err, data) {
            if (err) {
              callback(err, null);
            }
            else {
              data.tests = _.find(data.tests, {_id: params.testId});
              callback(null, data);
            }
          });
    }
  };

})();

var testDAO = new TestDAO();
module.exports = testDAO;
