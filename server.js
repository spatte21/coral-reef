var Hapi = require('hapi');
var moment = require('moment');
var dbConfig = require('./db');
var server;

var port = process.env.PORT || 3000;
console.log(port);

if (typeof port === 'string' && port.indexOf('pipe') >= 0) {
  console.log('running on azure...')
  server = new Hapi.Server(process.env.PORT);
}
else {
  console.log('running locally');
  server = new Hapi.Server('localhost', 3000);
}

server.pack.register({
  plugin: require('hapi-mongodb'),
  options: {
    'url': 'mongodb://' + dbConfig.username + ':' + dbConfig.password + '@' + dbConfig.host + ':' + dbConfig.port + '/' + dbConfig.db,
    'settings': {
      'db': {
        'native_parser': false
      }
    }
  }
}, function(err) {
  console.log('hapi-mongodb registered');
  if (err) {
    console.error(err);
    throw err;
  }
});

server.route({
  method: 'POST',
  path: '/build',
  handler: function(request, reply) {
    var returnData;
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

    // Create the build record
    db.collection('builds').insert({
      buildId: request.payload.buildId,
      branch: request.payload.branch,
      startTime: new Date()
    }, function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }
      if (result.length <= 0) {
        return reply(Hapi.error.internal('No records created'));
      }

      returnData = result[0];

      // Now insert a deployment record to join the queue
      db.collection('deployments').insert({
        buildId: request.payload.buildId,
        branch: request.payload.branch,
        queued: new Date(),
        status: 'queued'
      }, function(err, result) {
        if (err) {
          return reply(Hapi.error.internal('Internal mongo error', err));
        }
        if (result.length <= 0) {
          return reply(Hapi.error.internal('No records created'));
        }

        returnData.deployment = result[0];
        reply(returnData);
      });
    });
  }
});

server.route({
  method: 'GET',
  path: '/build/{id}',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    var build;

    db.collection('builds').findOne({'_id': new ObjectID(request.params.id)}, function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      build = result;
      db.collection('deployments').find({'buildId':result.buildId}).sort({'queued':1}).toArray(function(err, result) {
        if (err) {
          return reply(Hapi.error.internal('Internal mongo error', err));
        }

        build.deployments = result;

        db.collection('testResults').find({'buildId': build.buildId}).sort({'module':1, 'submodule':1}).toArray(function(err, result) {
          if (err) {
            return reply(Hapi.error.internal('Internal mongo error', err));
          }

          build.tests = result;
          reply(build);
        });
      });
    });
  }
});

server.route({
  method: 'GET',
  path: '/build/branch/{branch}',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;

    db.collection('builds').find({'branch': request.params.branch}).toArray(function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      reply(result);
    });
  }
});

server.route({
  method: 'GET',
  path: '/deployment/queue',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;

    db.collection('deployments').find({'status': 'queued'}).sort({'queued':1}).toArray(function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      reply(result);
    });
  }
});

server.route({
  method: 'GET',
  path: '/deployment/{id}',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

    db.collection('deployments').findOne({'_id': new ObjectID(request.params.id)}, function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      reply(result);
    });
  }
});

server.route({
  method: 'GET',
  path: '/deployment/queue/peek',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;

    db.collection('deployments').find({'status': 'queued'}, {limit:1}).sort({'queued':1}).nextObject(function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      reply(result);
    });
  }
});

server.route({
  method: 'PUT',
  path: '/deployment/queue/pop',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;

    db.collection('deployments').findAndModify({'status': 'queued'}, [['queued', 1]], {$set:{'status':'deploying', 'dequeued': new Date()}}, {'new': true}, function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      reply(result);
    });
  }
});

server.route({
  method: 'POST',
  path: '/deployment/{id}/actions',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

    switch (request.payload.type) {
      case 'complete':
      default:

        delete request.payload.type;
        request.payload.completed = new Date();
        request.payload.status = 'complete';

        db.collection('deployments').findAndModify({'_id': new ObjectID(request.params.id)}, [], {$set: request.payload}, {'new':true}, function(err, result) {
          if (err) {
            return reply(Hapi.error.internal('Internal mongo error', err));
          }

          // Now get the tests that we need to run for this branch
          var deployment = result;
          db.collection('testConfiguration').find({branch: deployment.branch}).toArray(function(err, result) {
            if (err) {
              return reply(Hapi.error.internal('Internal mongo error', err));
            }

            var tests = [];
            result.forEach(function(element) {
              element.suites.forEach(function(suite) {
                tests.push({
                  buildId: deployment.buildId,
                  deploymentId: deployment._id,
                  module: suite.module,
                  submodule: suite.submodule,
                  queued: new Date(),
                  status: 'queued'
                });
              });
            });

            db.collection('testResults').insert(tests, function(err) {
              if (err) {
                return reply(Hapi.error.internal('Internal mongo error', err));
              }

              reply(deployment);
            });
          });
        });
        break;
    }
  }
});

server.route({
  method: 'GET',
  path: '/test/queue',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;

    db.collection('testResults').find({'status': 'queued'}).sort({'queued': 1, 'module': 1, 'submodule': 1}).toArray(function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      reply(result);
    });
  }
});

server.route({
  method: 'GET',
  path: '/test/queue/peek',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;

    db.collection('testResults').find({'status': 'queued'}, {limit:1}).sort({'queued': 1, 'module': 1, 'submodule': 1}).nextObject(function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      reply(result);
    });
  }
});

server.route({
  method: 'PUT',
  path: '/test/queue/pop',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var test;

    db.collection('testResults').findAndModify({'status': 'queued'}, [['queued', 1], ['module', 1], ['submodule', 1]], {$set:{'status':'testing', 'dequeued': new Date()}}, {'new': true}, function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      test = result;

      db.collection('deployments').find({'_id': result.deploymentId}, function(err, result) {
        if (err) {
          return reply(Hapi.error.internal('Internal mongo error', err));
        }

        delete test.deploymentId;
        test.deployment = result;
        reply(result);
      });
  });
  }
});

server.route({
  method: 'GET',
  path: '/test/{id}',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

    db.collection('testResults').findOne({'_id': new ObjectID(request.params.id)}, function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      reply(result);
    });
  }
});

server.route({
  method: 'POST',
  path: '/test/{id}/actions',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

    switch (request.payload.type) {
      case 'complete':
      default:

        delete request.payload.type;
        request.payload.completed = new Date();
        request.payload.status = 'complete';

        db.collection('testResults').findAndModify({'_id': new ObjectID(request.params.id)}, [], {$set: request.payload}, {'new':true}, function(err, result) {
          if (err) {
            return reply(Hapi.error.internal('Internal mongo error', err));
          }

          reply(result);
        });

        break;
    }
  }
});


//if (!module.parent) {
  try {
    server.start(function () {
      console.log('Server running at: ', server.info.uri);
    });
  }
  catch (ex) {
    console.log(ex);
  }
//}

module.exports = server;
