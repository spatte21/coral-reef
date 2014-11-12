'use strict';

var ReplyHelper = require('./reply-helper');
var testDAO = require('../dao/test');
var _ = require('lodash');

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

      testDAO.find(params, helper.replyFind.bind(helper));
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
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);

      switch (params.type) {
        case 'complete':
        default:
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

          testDAO.update(params, helper.replyUpdate.bind(helper));
          break;
      }
    }
  };

})();

var testController = new TestController();
module.exports = testController;
