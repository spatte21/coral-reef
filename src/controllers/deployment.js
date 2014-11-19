'use strict';

var ReplyHelper = require('./reply-helper');
var deploymentDAO = require('../dao/deployment');
var testConfigurationDAO = require('../dao/testConfiguration');
var buildDAO = require('../dao/build');
var _ = require('lodash');
var Q = require('q')

function transformToDeployment(record) {
  if (!!record) {
    return {
      _id: record._id,
      buildId: record.buildId,
      branch: record.branch,
      queued: record.deployment.queued,
      status: record.deployment.status,
      snapshotFile: record.deployment.snapshotFile,
      snapshotName: record.deployment.snapshotFile,
      environment: record.deployment.environment,
      environmentStatus: record.deployment.environmentStatus || null,
      hrUrl: record.deployment.hrUrl || null,
      recruitmentUrl: record.deployment.recruitmentUrl || null,
      mobileUrl: record.deployment.mobileUrl || null,
      octopusDeploymentId: record.deployment.octopusDeploymentId || null
    };
  }
  else {
    return null;
  }
};

function DeploymentController(){};
DeploymentController.prototype = (function() {
  return {
    queue: function queue(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { 'deployment.status': 'queued'},
        fields: { buildId:1, branch:1, deployment:1 },
        sort: [[ 'deployment.queued',1 ]]
      });

      deploymentDAO.find(params, function(err, data) {
        helper.replyQueue(err, _.map(data, transformToDeployment));
      });
    },

    queuePop: function queuePop(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { 'deployment.status':'queued' },
        sort: [['deployment.queued', 1]],
        update: {
          $set: {status: 'deploying', 'deployment.status':'deploying', 'deployment.dequeued':new Date()},
          $push: {messages: {type:'info', description: 'Deployment started', timestamp: new Date()}}
        }
      });

      deploymentDAO.update(params, function(err, data) {
        helper.replyQueueItem(err, transformToDeployment(data));
      });
    },

    queuePeek: function queuePeek(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { 'deployment.status': 'queued'},
        fields: { buildId:1, branch:1, deployment:1 },
        sort: [[ 'deployment.queued',1 ]]
      });

      deploymentDAO.findFirst(params, function(err, data) {
        helper.replyQueueItem(err, transformToDeployment(data));
      });
    },

    performAction: function performAction(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);

      switch (params.type) {
        case 'failed':
          _.assign(params, {
            query: { _id: new params.ObjectID(params.id) },
            sort: [],
            update: {
              $set: {
                status: 'failed',
                'deployment.status': 'failed',
                'deployment.completed': new Date()
              },
              $push: {messages: {type:'error', description: 'Deployment failed', timestamp: new Date()}}
            }
          });

          deploymentDAO.update(params, function(err, data) {
            helper.replyUpdate(err, transformToDeployment(data));
          });
          break;

        case 'environment-recycled':
          _.assign(params, {
            query: { _id: new params.ObjectID(params.id) },
            sort: [],
            update: {
              $set: {'deployment.environmentStatus': 'recycled'},
              $push: {messages: {type:'info', description: 'Deployment environment recycled', timestamp: new Date()}}
            }
          });

          deploymentDAO.update(params, function(err, data) {
            helper.replyUpdate(err, transformToDeployment(data));
          });
          break;

        case 'complete':

          var update = {
            'deployment.status': params.type,
            'deployment.completed': new Date(),
            'deployment.environment': params.environment,
            'deployment.hrUrl': params.hrUrl,
            'deployment.recruitmentUrl': params.recruitmentUrl,
            'deployment.mobileUrl': params.mobileUrl,
            'deployment.octopusDeploymentId': params.octopusDeploymentId
          };

          var findBuild = Q.nfbind(buildDAO.findById);
          var findTests = Q.nfbind(testConfigurationDAO.findByBranch);
          var updateBuild = Q.nfbind(deploymentDAO.update);

          findBuild(params).then(function(data) {
            if (data.exception) {
              reply(Hapi.error.badRequest(data.exception));
              done();
            }

            params.branch = data.branch;
            return findTests(params);

          }).then(function(data) {
            var tests = data;

            if (!!tests && tests.length > 0) {
              update.status = 'tests queued';
              update['deployment.environmentStatus'] = 'in use';
              update.tests = [];
              tests.forEach(function (element) {
                element.suites.forEach(function (suite) {
                  update.tests.push({
                    module: suite.module,
                    suite: suite.suite,
                    queued: new Date(),
                    status: 'queued'
                  });
                });
              });
            }
            else {
              update.status = 'not for testing';
              update['deployment.environmentStatus'] = 'finished';
            }

            _.assign(params, {
              query: { _id: new params.ObjectID(params.id) },
              sort: [],
              update: {
                $set: update,
                $push: {messages: {type:'info', description: 'Deployment completed', timestamp: new Date()}}
              }
            });

            return updateBuild(params);

          }).then(function(data) {
            if (data.exception) {
              reply(Hapi.error.badRequest(data.exception));
            }
            else {
              reply(transformToDeployment(data));
            }
            done();

          }).catch(function(err) {
            reply(Hapi.error.badImplementation(err));
          });

          break;
      }
    },

    findById: function findById(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);

      _.assign(params, {
        query: {_id: new params.ObjectID(params.id) }
      });

      deploymentDAO.findById(params, function(err, data) {
        helper.replyFindOne(err, transformToDeployment(data));
      });
    },

    query: function query(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      params.query = {};

      if (!!params.environmentStatus) {
        params.query['deployment.environmentStatus'] = params.environmentStatus;
      }

      if (!!params.status) {
        params.query['deployment.status'] = params.status;
      }

      if (!!params.buildId) {
        params.query['buildId'] = params.buildId;
      }

      deploymentDAO.find(params, function(err, data) {
        helper.replyFind(err, _.map(data, transformToDeployment));
      });
    }
  };
})();

var deploymentController = new DeploymentController();
module.exports = deploymentController;
