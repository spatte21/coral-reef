var Boom = require('boom');
var userDAO = require('../dao/user');
var UserModel = require('../models/user');
var _ = require('lodash');

function AuthController(){};
AuthController.prototype = (function() {

  return {

    login: function login(request, reply) {
      var params = request.plugins.createControllerParams(request);

      userDAO.findByUsername(params, function(err, user) {
        if (err) {
          console.error('Data access error', err);
          return reply(Boom.badImplementation('Database error', err));
        }

        if (!!user) {
          var userModel = new UserModel();
          if (userModel.authenticate(params.password, user.password)) {

            _.assign(params, {
              userId: user._id,
              token: userModel.generateToken(user._id)
            });

            userDAO.updateToken(params, function(err) {

              if (err) {
                console.error('Data access error', err);
                return reply(Boom.badImplementation('Database error', err));
              }

              delete user.password;
              delete user.token;
              reply({
                token: params.token,
                user: user
              });
            })
          }
          else {
            reply(Boom.unauthorized('Invalid credentials'));
          }
        }
        else {
          reply(Boom.unauthorized('Invalid credentials'));
        }
      });
    },

    register: function register(request, reply) {
      var params = request.plugins.createControllerParams(request);

      userDAO.findByUsername(params, function(err, data) {
        if (err) {
          console.error('Data access error', err);
          return reply(Boom.badImplementation('Database error', err));
        }

        if (data && data.length > 0) {
          reply(Boom.conflict('Username already exists'));
        }

        var userModel = new UserModel();
        _.assign(params, { password: userModel.hashPassword(params.password)});
        userDAO.insert(params, function(err, data) {
          if (err) {
            console.error('Data access error', err);
            return reply(Boom.badImplementation('Database error', err));
          }

          reply(data[0]);
        });
      });
    }
  };
})();

var authController = new AuthController();
module.exports = authController;
