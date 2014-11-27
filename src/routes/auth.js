'use strict';

var authController = require('../controllers/auth');
var Joi = require('joi');

module.exports = function() {
  return [
    {
      method: 'POST',
      path: '/login',
      handler: authController.login,
      config: {
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/register',
      handler: authController.register,
      config: {
        auth: false,
        description: 'Used to register a new user',
        validate: {
          payload: {
            username: Joi.string().required().min(4).description('The username of the new user'),
            password: Joi.string().required().min(6).description('The password of the new user')
          }
        }
      }
  }
  ];
}();
