var Hapi = require('hapi');
var Joi = require('joi');
var constants = require('./src/config/constants');
var moment = require('moment');
var _ = require('lodash');
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
  {
    plugin: require('lout')
  }
], function(err) {
  if (err) {
    console.error(err);
    throw err;
  }

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
