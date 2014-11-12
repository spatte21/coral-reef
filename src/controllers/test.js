'use strict';

var ReplyHelper = require('./reply-helper');
var testDAO = require('../dao/test');
var deploymentDAO = require('../dao/deployment');
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

      testDAO.findFirst(params, function(err, data) {
        var test = data;
        if (!!test) {
          _.assign(params, { id: test.deploymentId });
          deploymentDAO.findById(params, function(err, data) {
            test.deployment = data;
            helper.replyFindOne(err, test);
          })
        }
        else {
          helper.replyFindOne(err, test);
        }
      });
    },

    queuePop: function queuePop(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { status: 'queued' },
        sort: [['queued', 1], ['module', 1], ['suite', 1]],
        update: { status: 'testing', dequeued: new Date() }
      });

      testDAO.update(params, function(err, data) {
        var test = data;
        if (!!test) {
          _.assign(params, { id: test.deploymentId });
          deploymentDAO.findById(params, function(err, data) {
            test.deployment = data;
            helper.replyUpdate(err, test);
          })
        }
        else {
          helper.replyUpdate(err, test);
        }
      });
    },

    findById: function findById(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { _id: new params.ObjectID(params.id) }
      });

      testDAO.findById(params, function(err, data) {
        var test = data;
        if (!!test) {
          _.assign(params, { id: test.deploymentId });
          deploymentDAO.findById(params, function(err, data) {
            test.deployment = data;
            helper.replyFindOne(err, test);
          })
        }
        else {
          helper.replyFindOne(err, test);
        }
      });
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

          testDAO.update(params, function(err, data) {
            var test = data;
            if (!!test) {
              _.assign(params, {
                query: {buildId: test.buildId, status: {$ne: 'complete'}},
                sort: {}
              });
              testDAO.find(params, function(err, data) {
                if (data.length === 0) {
                  _.assign(params, {
                    query: {_id: new params.ObjectID(test.deploymentId)},
                    sort: [],
                    update: {environmentStatus: 'finished'}
                  });

                  deploymentDAO.update(params, function(err, data) {
                    helper.replyUpdate(err, test);
                  })
                }
                else {
                  helper.replyUpdate(err, test);
                }
              })
            }
            else {
              helper.replyUpdate(err, test);
            }
          });

          break;
      }
    }
  };

})();

var testController = new TestController();
module.exports = testController;
