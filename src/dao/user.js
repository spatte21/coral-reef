'use strict';

function UserDAO(){};
UserDAO.prototype = (function() {

  return {
    findByUserId: function findByUserId(params, callback) {
      var db = params.db;
      db.collection('users')
        .findOne({_id: params.userId}, callback);
    },

    findByUsername: function findByUsername(params, callback) {
      var db = params.db;
      db.collection('users')
        .findOne({username: params.username}, callback);
    },

    updateToken: function updateToken(params, callback) {
      var db = params.db;
      db.collection('users')
        .findAndModify({_id: params.userId}, {}, {$set:{token: params.token}}, {new:true}, function(err, data) {
          callback(err, data);
        });
    },

    insert: function insert(params, callback) {
      var db = params.db;
      db.collection('users')
        .insert({username: params.username, password: params.password}, callback);
    }
  };

})();

var userDAO = new UserDAO();
module.exports = userDAO;
