'use strict';

var ReplyHelper = require('./reply-helper');
var testDAO = require('../dao/test');
var deploymentDAO = require('../dao/deployment');
var _ = require('lodash');
var Q = require('q');

function TestController(){};
TestController.prototype = (function() {

  return {
    queue: function queue(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { status: 'queued' },
        sort: { queued: 1, module: 1, suite: 1 }
      });

      testDAO.find(params, helper.replyQueue.bind(helper));
    },

    queuePeek: function queuePeek(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { status: 'queued' },
        sort: { queued: 1, module: 1, suite: 1 }
      });

      testDAO.findFirst(params, helper.replyFindOne.bind(helper));
    },

    queuePop: function queuePop(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { status: 'queued' },
        sort: [['queued', 1], ['module', 1], ['suite', 1]],
        update: { status: 'testing', dequeued: new Date() }
      });

      testDAO.update(params, helper.replyUpdate.bind(helper));
    },

    findById: function findById(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { _id: new params.ObjectID(params.id) }
      });

      testDAO.findById(params, helper.replyFindOne.bind(helper));
    },

    performAction: function performAction(request, reply) {
      var params = request.plugins.createControllerParams(request);

      switch (params.type) {
        case 'complete':
        default:

          var updateTest = Q.nfbind(testDAO.update);
          var find = Q.nfbind(testDAO.find);
          var updateDeployment = Q.nfbind(deploymentDAO.update);
          var result;

          _.assign(params, {
            query: {_id: new params.ObjectID(params.id)},
            sort: [],
            update: {
              completed: new Date(),
              status: 'complete',
              results: params.results,
              resultsText: params.resultText
            }
          });

          updateTest(params).then(function(data) {
            result = data;
            if (result.exception) {
              reply(Hapi.error.badRequest(result.exception));
              done();
            }

            _.assign(params, {
              query: {buildId: result.buildId, status: {$ne: 'complete'}},
              sort: {}
            });
            return find(params);

          }).then(function(data) {
            if (result.exception) {
              reply(Hapi.error.badRequest(result.exception));
              done();
            }

            if (!!data && data.length === 0) {
              _.assign(params, {
                query: {_id: new params.ObjectID(result.deploymentId)},
                sort: [],
                update: {environmentStatus: 'finished'}
              });

              return updateDeployment(params);
            }
            else {
              reply(result);
              done();
            }
          }).then(function(data) {
            if (data.exception) {
              reply(Hapi.error.badRequest(data.exception));
            }
            else {
              reply(result);
            }
            done();
          }).catch(function(err) {
            reply(Hapi.error.badImplementation(err));
          });
          break;
      }
    }
  };

})();

var testController = new TestController();
module.exports = testController;
