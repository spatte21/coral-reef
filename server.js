var Hapi = require('hapi');
var moment = require('moment');
var dbConfig = require('./db');
var Joi = require('joi');
var _ = require('lodash');
var server;

var port = process.env.PORT || 3000;
var azure = false;

if (typeof port === 'string' && port.indexOf('pipe') >= 0) {
  azure = true;
  server = new Hapi.Server(process.env.PORT, {cors:{origin:['*']}});
}
else {
  server = new Hapi.Server('localhost', 3000, {cors:{origin:['*']}});
}

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

        db.collection('testResults').find({'buildId': build.buildId}).sort({'module':1, 'suite':1}).toArray(function(err, result) {
          if (err) {
            return reply(Hapi.error.internal('Internal mongo error', err));
          }

          build.tests = result;
          reply(build);
        });
      });
    });
  },
  config: {
    description: 'Returns a specific build record with the supplied internal _id',
    validate: {
      params: {
        id: Joi.string().description('The unique _id (a mongo ObjectId) of the build record')
      }
    }
  }
});

server.route({
  method: 'GET',
  path: '/build',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var buildId = request.query.buildId;

    if (!!buildId) {
      db.collection('builds').findOne({'buildId': buildId}, function (err, result) {
        if (err) {
          return reply(Hapi.error.internal('Internal mongo error', err));
        }

        var build = result;
        db.collection('deployments').find({'buildId':result.buildId}).sort({'queued':1}).toArray(function(err, result) {
          if (err) {
            return reply(Hapi.error.internal('Internal mongo error', err));
          }

          build.deployments = result;

          db.collection('testResults').find({'buildId': build.buildId}).sort({'module':1, 'suite':1}).toArray(function(err, result) {
            if (err) {
              return reply(Hapi.error.internal('Internal mongo error', err));
            }

            build.tests = result;
            reply(build);
          });
        });
      });
    }
    else {
      reply([]);
    }
  },
  config: {
    description: 'Returns build records matching the filters supplied on the query string',
    validate: {
      query: {
        buildId: Joi.string().optional().description('If supplied will return the build with this buildId, e.g. 5.1.4343')
      }
    }
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
  },
  config: {
    description: 'Returns the queue of deployment records'
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
  },
  config: {
    description: 'Returns the deployment record with the internal _id value supplied',
    validate: {
      params: {
        id: Joi.string().description('The unique _id (a mongo ObjectId) of the deployment record')
      }
    }
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
  },
  config: {
    description: 'Returns the deployment at the head of the queue but without marking it as deploying, i.e. leaving it in the queue'
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
  },
  config: {
    description: 'Returns the deployment at the head of the queue, marking it as deploying, and hence removing it from the queue'
  }
});

server.route({
  method: 'POST',
  path: '/deployment/{id}/actions',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

    switch (request.payload.type) {

      case 'failed':
        delete request.payload.type;
        request.payload.completed = new Date();
        request.payload.status = 'failed';
        db.collection('deployments').findAndModify({'_id': new ObjectID(request.params.id)}, [], {$set: request.payload}, {'new':true}, function(err, result) {
          if (err) {
            return reply(Hapi.error.internal('Internal mongo error', err));
          }
          reply(result);
        });
        break;

      case 'environment-recycled':
        delete request.payload.type;
        db.collection('deployments').findAndModify({'_id': new ObjectID(request.params.id)}, [], {$set: {environmentStatus:'recycled'}}, {'new':true}, function(err, result) {
          if (err) {
            return reply(Hapi.error.internal('Internal mongo error', err));
          }
          reply(result);
        });
        break;

      case 'complete':

        delete request.payload.type;
        request.payload.completed = new Date();
        request.payload.status = 'complete';
        request.payload.environmentStatus = 'in use';

        db.collection('deployments').findAndModify({'_id': new ObjectID(request.params.id)}, [], {$set: request.payload}, {'new':true}, function(err, result) {
          if (err) {
            return reply(Hapi.error.internal('Internal mongo error', err));
          }

          // Now get the tests that we need to run for this branch
          var deployment = result;

          db.collection('testConfiguration').find({}).toArray(function(err, result) {
            if (err) {
              return reply(Hapi.error.internal('Internal mongo error', err));
            }
            var tests = [];
            result.forEach(function(element) {

              if (deployment.branch.indexOf(element.branch) >= 0) {
                element.suites.forEach(function(suite) {
                  tests.push({
                    buildId: deployment.buildId,
                    deploymentId: deployment._id,
                    module: suite.module,
                    suite: suite.suite,
                    queued: new Date(),
                    status: 'queued'
                  });
                });
              }
            });

            if (tests.length > 0) {
              db.collection('testResults').insert(tests, function (err) {
                if (err) {
                  return reply(Hapi.error.internal('Internal mongo error', err));
                }

                reply(deployment);
              });
            }
            else {
              reply(deployment);
            }
          });
        });
        break;
    }
  },
  config: {
    description: 'General purpose endpoint for performing actions against a deployment record, e.g. completing it',
    validate: {
      params: {
        id: Joi.string().description('The unique _id (a mongo ObjectId) of the deployment record')
      },
      payload: {
        type: Joi.string().regex(/complete|failed|environment-recycled/).description('The action to perform. Supported actions: \'complete\', \'failed\', \'environment-recycled\''),
        environment: Joi.string().optional().description('The environment on which the deploy was performed, e.g. Capri'),
        hrUrl: Joi.string().optional().description('The url of the HR application'),
        recruitmentUrl: Joi.string().optional().description('The url of the Online Recruitment application'),
        mobileUrl: Joi.string().optional().description('The url of the Mobile application'),
        snapshotName: Joi.string().optional().description('The name of the data snapshot used in the deployment'),
        snapshotFile: Joi.string().optional().description('The filename of the data snapshot used in the deployment'),
        octopusDeploymentId: Joi.string().optional().description('The deployment ID in Octopus Deploy')
      }
    }
  }
});

server.route({
  method: 'GET',
  path: '/deployment',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var environmentStatus = request.query.environmentStatus;

    if (!!environmentStatus) {
      db.collection('deployments').find({'environmentStatus':environmentStatus}).sort({'queued':1}).toArray(function(err, result) {
        if (err) {
          return reply(Hapi.error.internal('Internal mongo error', err));
        }

        reply(result);
      });
    }
    else {
      reply([]);
    }
  },
  config: {
    description: 'Returns deployment records matching the filters supplied on the query string',
    validate: {
      query: {
        environmentStatus: Joi.string().optional().description('If supplied will return the deployment with this environment status, e.g. in use')
      }
    }
  }
});

server.route({
  method: 'GET',
  path: '/test/queue',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var test;

    db.collection('testResults').find({'status': 'queued'}).sort({'queued': 1, 'module': 1, 'suite': 1}).toArray(function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      test = result;

      db.collection('deployments').findOne({'_id': result.deploymentId}, function(err, result) {
        if (err) {
          return reply(Hapi.error.internal('Internal mongo error', err));
        }

        delete test.deploymentId;
        test.deployment = result;
        reply(test);
      });
    });
  },
  config: {
    description: 'Returns the queue of tests that are waiting to be performed'
  }
});

server.route({
  method: 'GET',
  path: '/test/queue/peek',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var test;

    db.collection('testResults').find({'status': 'queued'}, {limit:1}).sort({'queued': 1, 'module': 1, 'suite': 1}).nextObject(function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      if (!result) {
        reply([]);
      }
      else {
        test = result;

        db.collection('deployments').findOne({'_id': result.deploymentId}, function (err, result) {
          if (err) {
            return reply(Hapi.error.internal('Internal mongo error', err));
          }

          delete test.deploymentId;
          test.deployment = result;
          reply(test);
        });
      }
    });
  },
  config: {
    description: 'Returns the test at the head of the queue but without marking it as testing, i.e. leaving it in the queue'
  }
});

server.route({
  method: 'PUT',
  path: '/test/queue/pop',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var test;

    db.collection('testResults').findAndModify({'status': 'queued'}, [['queued', 1], ['module', 1], ['suite', 1]], {$set:{'status':'testing', 'dequeued': new Date()}}, {'new': true}, function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      test = result;

      db.collection('deployments').findOne({'_id': result.deploymentId}, function(err, result) {
        if (err) {
          return reply(Hapi.error.internal('Internal mongo error', err));
        }

        delete test.deploymentId;
        test.deployment = result;
        reply(test);
      });
    });
  },
  config: {
    description: 'Returns the test at the head of the queue, marking it as testing, and hence removing it from the queue'
  }
});

server.route({
  method: 'GET',
  path: '/test/{id}',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    var test;

    db.collection('testResults').findOne({'_id': new ObjectID(request.params.id)}, function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      test = result;

      db.collection('deployments').findOne({'_id': result.deploymentId}, function(err, result) {
        if (err) {
          return reply(Hapi.error.internal('Internal mongo error', err));
        }

        delete test.deploymentId;
        test.deployment = result;
        reply(test);
      });
    });
  },
  config: {
    description: 'Returns the deployment record with the internal _id value supplied',
    validate: {
      params: {
        id: Joi.string().description('The unique _id (a mongo ObjectId) of the test record')
      }
    }
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

          var testResult = result;
          db.collection('testResults').find({buildId: result.buildId, status: { $ne: 'complete' }}).toArray(function(err, result) {
            if (err) {
              return reply(Hapi.error.internal('Internal mongo error', err));
            }

            if (result.length === 0) {
              db.collection('deployments').findAndModify({'_id': new ObjectID(testResult.deploymentId)}, [], {$set: { environmentStatus: 'finished' }}, {'new':true}, function(err, result) {
                if (err) {
                  return reply(Hapi.error.internal('Internal mongo error', err));
                }

                reply(testResult);
              });
            }

            reply(testResult);
          });
        });

        break;
    }
  },
  config: {
    description: 'General purpose endpoint for performing actions against a deployment record, e.g. completing it',
    validate: {
      params: {
        id: Joi.string().description('The unique _id (a mongo ObjectId) of the test record')
      },
      payload: {
        type: Joi.string().regex(/complete/).description('The action to perform. Supported actions: \'complete\''),
        results: Joi.object().optional().description('The results of the test expressed as a string that will parse to a JSON object'),
        resultsText: Joi.string().optional().description('The results of the test expressed as a string (for non-JSON results)')
      }
    }
  }

});

server.route({
  method: 'GET',
  path: '/releaseEvent',
  handler: function(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('releaseEvents').find({'ends': { $gt: new Date(moment().add(-14, 'd').toISOString()) }}).sort({'starts':1}).toArray(function(err, result) {
      if (err) {
        return reply(Hapi.error.internal('Internal mongo error', err));
      }

      reply(result);
    });
  },
  config: {
    description: 'Returns the set of release events that are upcoming or have ended in the last fortnight'
  }
});

server.pack.register([
  {
    plugin: require('hapi-mongodb'),
    options: {
      'url': 'mongodb://' + dbConfig.username + ':' + dbConfig.password + '@' + dbConfig.host + ':' + dbConfig.port + '/' + dbConfig.db,
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
      params = _.assign(request.payload);
    }

    if (request.query) {
      params = _.assign(request.query);
    }

    params.db = request.server.plugins['hapi-mongodb'].db;
    params.ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

    return params;
  }
  next();
});

module.exports = server;
