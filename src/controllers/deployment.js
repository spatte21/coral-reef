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

      deploymentDAO.find(params, helper.replyFind.bind(helper));
    },

    queuePop: function queuePop(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { status: 'queued' },
        sort: [['queued', 1]],
        update: { status: 'deploying', dequeued: new Date() }
      });

      deploymentDAO.update(params, helper.replyUpdate.bind(helper));
    },

    queuePeek: function queuePeek(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { status: 'queued' },
        sort: { queued: 1 }
      });

      deploymentDAO.findFirst(params, helper.replyFindFirst.bind(helper));
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

          deploymentDAO.update(params, helper.replyUpdate.bind(helper));
          break;

        case 'environment-recycled':
          _.assign(params, {
            query: { _id: new params.ObjectID(params.id) },
            sort: [],
            update: { environmentStatus: 'recycled' }
          });

          deploymentDAO.update(params, helper.replyUpdate.bind(helper));
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

          deploymentDAO.update(params, helper.replyUpdate.bind(helper));
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
