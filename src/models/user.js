'use strict';

var bcrypt = require('bcrypt');
var jwt = require('jwt-simple');
var moment = require('moment');

var secret = 'gdfjklj6tips5erwf23rfmkkds';

function UserModel() {};

UserModel.prototype = (function() {
  return {

    hashPassword: function hashPassword(password) {
      var salt = bcrypt.genSaltSync(10);
      console.log('password and salt', password, salt);
      var hash = bcrypt.hashSync(password, salt);
      return hash;
    },

    authenticate: function authenticate(password, hashedPassword) {
      return bcrypt.compareSync(password, hashedPassword);
    },

    generateToken: function generateToken(userId) {
      var token = jwt.encode({
        userId: userId,
        issued: moment().toISOString(),
        expires: moment().add(1, 'hour').toISOString()
      }, secret);

      return token;
    },

    decodeToken: function decodeToken(token) {
      return jwt.decode(token, secret);
    }

  };
})();

module.exports = UserModel;
