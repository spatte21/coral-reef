var Hapi = require('hapi');
var UserModel = require('./src/models/user');
var userDAO = require('./src/dao/user');
var constants = require('./src/config/constants');
var _ = require('lodash');
var moment = require('moment');
var routes = require('./src/routes');
var server;

var port = process.env.PORT || 3000;
var azure = false;

if (typeof port === 'string' && port.indexOf('pipe') >= 0) {
  azure = true;
  server = new Hapi.Server(process.env.PORT, {cors: {origin:['*']}});
}
else {
  server = new Hapi.Server('localhost', 3000, {cors: {origin:['*']}});
}

server.pack.register([
  {
    plugin: require('hapi-mongodb'),
    options: {
      'url': 'mongodb://' +
        constants.database.user +
        ':' +
        constants.database.password +
        '@' +
        constants.database.host +
        ':' +
        constants.database.port +
        '/' +
        constants.database.database,
      'settings': {
        'db': {
          'native_parser': false
        }
      }
    }
  },
  { plugin: require('lout') },
  require('hapi-auth-bearer-token')

], function(err) {
  if (err) {
    console.error(err);
    throw err;
  }

  server.auth.strategy('simple', 'bearer-access-token', 'required', {
    validateFunc: function(token, callback) {
      var request = this;
      var params = request.plugins.createControllerParams(request);
      var userModel = new UserModel();
      var decodedToken;

      try {
        decodedToken = userModel.decodeToken(token);
      }
      catch (exception) {
        callback(null, false, {});
      }

      if (!!decodedToken && moment(decodedToken.expires).isAfter()) {
        _.assign(params, { userId: new params.ObjectID(decodedToken.userId) });

        userDAO.findByUserId(params, function(err, user) {
          if (err) {
            console.error('Data access error', err);
            callback(err, false, {});
          }

          if (!!user && user.token === token) {

            callback(null, true, {token: token});
          }
          else {
            callback(null, false, {});
          }
        });
      }
      else {
        callback(null, false, {});
      }
    }
  });

  for (var route in routes) {
    server.route(routes[route]);
  }

  if (azure || !module.parent) {
    server.start(function () {
      console.log('Server running at: ', server.info.uri);
    });
  }
});

server.ext('onRequest', function(request, next) {
  request.plugins.createControllerParams = function(request) {
    var params = _.clone(request.params);

    if (request.payload) {
      _.assign(params, request.payload);
    }

    if (request.query) {
      _.assign(params, request.query);
    }

    params.db = request.server.plugins['hapi-mongodb'].db;
    params.ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

    return params;
  }
  next();
});

module.exports = server;
