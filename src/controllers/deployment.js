'use strict';

var ReplyHelper = require('./reply-helper');
var deploymentDAO = require('../dao/deployment');
var testConfigurationDAO = require('../dao/testConfiguration');
var testDAO = require('../dao/test');
var _ = require('lodash');

function DeploymentController(){};
DeploymentController.prototype = (function() {
  return {
    queue: function queue(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { status: 'queued' },
        sort: { queued: 1 }
      });

      deploymentDAO.find(params, function(err, data) {
        helper.replyFind(err, data);
      });
    },

    queuePop: function queuePop(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { status: 'queued' },
        sort: [['queued', 1]],
        update: { status: 'deploying', dequeued: new Date() }
      });

      deploymentDAO.update(params, function(err, data) {
        helper.replyUpdate(err, data);
      });
    },

    queuePeek: function queuePeek(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { status: 'queued' },
        sort: { queued: 1 }
      });

      deploymentDAO.findFirst(params, function(err, data) {
        helper.replyFindFirst(err, data);
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
            update: { completed: new Date(), status: params.type }
          });
          deploymentDAO.update(params, function(err, data) {
            helper.replyUpdate(err, data);
          });

          break;

        case 'environment-recycled':
          _.assign(params, {
            query: { _id: new params.ObjectID(params.id) },
            sort: [],
            update: { environmentStatus: 'recycled' }
          });
          deploymentDAO.update(params, function(err, data) {
            helper.replyUpdate(err, data);
          });

          break;

        case 'complete':
          _.assign(params, {
            query: { _id: new params.ObjectID(params.id) },
            sort: [],
            update: {
              completed: new Date(),
              status: params.type,
              environment: params.environment,
              environmentStatus: 'in use',
              hrUrl: params.hrUrl,
              recruitmentUrl: params.recruitmentUrl,
              mobileUrl: params.mobileUrl,
              snapshotName: params.snapshotName,
              snapshotFile: params.snapshotFile,
              octopusDeploymentId: params.octopusDeploymentId
            }
          });
          deploymentDAO.update(params, function(err, data) {

            var deployment = data;
            params.query = {};
            if (!err) {
              testConfigurationDAO.find(params, function (err, data) {

                var tests = [];
                data.forEach(function (element) {
                  if (deployment.branch.indexOf(element.branch) >= 0) {
                    element.suites.forEach(function (suite) {
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
                  _.assign(params, {
                    insert: tests
                  });
                  testDAO.insert(params, function (err) {
                    helper.replyUpdate(err, deployment);
                  });
                }
                else {
                  //set environment status as complete
                  // atually do this before we deploy
                  helper.replyUpdate(err, deployment);
                }
              });
            }
            else {
              helper.replyUpdate(err, deployment);
            }
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

      deploymentDAO.findById(params, helper.replyFindOne.bind(helper));
    },

    query: function query(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      params.query = {};
      params.sort = {
        queued: 1
      };

      if (!!params.environmentStatus) {
        params.query.environmentStatus = params.environmentStatus;
      }

      deploymentDAO.find(params, function(err, data) {
        helper.replyFind(err, data);
      });
    }
  };
})();

var deploymentController = new DeploymentController();
module.exports = deploymentController;
