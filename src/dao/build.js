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
        .toArray(callback);
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
