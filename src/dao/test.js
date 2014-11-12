'use strict';

function TestDAO(){};
TestDAO.prototype = (function() {

  return {
    findById: function findById(params, callback) {
      var db = params.db;
      db.collection('testResults')
        .findOne({_id: new params.ObjectID(params.id)}, callback);
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
        .nextObject(callback);
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
          callback);
    }
  };

})();

var testDAO = new TestDAO();
module.exports = testDAO;
