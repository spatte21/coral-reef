"use strict";

var UserModel = require('../models/user');
var userDAO = require('../dao/user');
var Joi = require('joi');

module.exports = function(username, password, callback) {

  var userModel = new UserModel();
  var hashedPassword = userModel.hashPassword(password);

  userDAO.findOne(username, hashedPassword, function(err, result) {
    if (err || result.length < 1) return callback(err, false);

    var user = result[0];
    var isValid = validate(result);

    callback(null, isValid, user);
  });
};

function validate(credentials) {
  credentials = credentials || {};
  var schema = {
    id: Joi.number().integer().required(),
    username: Joi.string().max(50).required()
  };

  var err = Joi.validate(credentials, schema, {allowUnknown:true});
  return err === null;
}
