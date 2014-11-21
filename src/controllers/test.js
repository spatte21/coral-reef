'use strict';

var ReplyHelper = require('./reply-helper');
var testDAO = require('../dao/test');
var buildDAO = require('../dao/build');
var testParser = require('../parser/parser');
var _ = require('lodash');
var Q = require('q');

function transformToTest(record) {
  if (!!record) {
    return {
      _id: record.tests._id || record.tests[0]._id,
      _parentId: record._id,
      buildId: record.buildId,
      branch: record.branch,
      queued: record.tests.queued,
      status: record.tests.status,
      module: record.tests.module,
      suite: record.tests.suite,
      hrUrl: record.deployment.hrUrl || null,
      recruitmentUrl: record.deployment.recruitmentUrl || null,
      mobileUrl: record.deployment.mobileUrl || null,
      results: record.tests.results || null
    };
  }
  else {
    return null;
  }
};

function TestController(){};
TestController.prototype = (function() {

  return {
    parse: function(request, reply) {
      var parsed = testParser.parse(request.payload.results);
      reply(parsed).code(200);
    },

    queue: function queue(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: {'tests.status':'queued'},
        sort: {'tests.queued':1, 'tests.module':1, 'tests.suite':1}
      });

      testDAO.find(params, function(err, data) {
        helper.replyQueue(err, _.map(data, transformToTest));
      });
    },

    queuePeek: function queuePeek(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: {'tests.status':'queued'},
        sort: {'tests.queued':1, 'tests.module':1, 'tests.suite':1}
      });

      testDAO.findFirst(params, function(err, data) {
        helper.replyQueueItem(err, transformToTest(data));
      });
    },

    queuePop: function queuePop(request, reply) {
      var params = request.plugins.createControllerParams(request);

      var findFirstInQueue = Q.nfbind(testDAO.findFirst);
      var updateTest = Q.nfbind(testDAO.update);

      _.assign(params, {
        query: {'tests.status':'queued'},
        sort: {'tests.queued':1, 'tests.module':1, 'tests.suite':1}
      });

      findFirstInQueue(params).then(function(data) {
        if (data === undefined) {
          reply(null).code(204);
          done();
        }
        else if (data.exception) {
          reply(Hapi.error.badRequest(data.exception));
          done();
        }
        else

        _.assign(params, {
          testId: data.tests._id,
          query: {tests: {$elemMatch: {_id: data.tests._id}}},
          update: {
            $set: {'tests.$.status': 'testing', 'tests.$.dequeued': new Date(), status: 'testing'},
            $push: {
              messages: {
                type: 'info',
                description: 'Testing started on [' + data.tests.module + '/' + data.tests.suite + ']',
                timestamp: new Date()
              }
            }
          }
        });

        return updateTest(params);

      }).then(function(data) {
        if (data.exception) {
          reply(Hapi.error.badRequest(data.exception));
        }
        else {
          reply(transformToTest(data));
        }
        done();
      }).catch(function(err) {
        reply(Hapi.error.badImplementation(err));
      });
    },

    findById: function findById(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: { 'tests._id': new params.ObjectID(params.id) }
      });

      testDAO.findById(params, function(err, data) {
        helper.replyFindOne(err, transformToTest(data));
      });
    },

    performAction: function performAction(request, reply) {
      var params = request.plugins.createControllerParams(request);

      var updateTest = Q.nfbind(testDAO.update);
      var findTest = Q.nfbind(testDAO.findById);
      var findBuild = Q.nfbind(buildDAO.findById);

      _.assign(params, {
        query: { 'tests._id': new params.ObjectID(params.id) }
      });

      var test;
      var build;

      findTest(params).then(function(data) {
        test = data;
        if (test === undefined) {
          reply(Hapi.error.notFound('No record found'));
          done();
        }
        else if (test.exception) {
          reply(Hapi.error.badRequest(test.exception));
          done();
        }

        _.assign(params, {
          id: test._id
        });

        return findBuild(params);

      }).then(function(data) {
        build = data;
        if (build === undefined || build === null) {
          reply(Hapi.error.notFound('No record found'));
          done();
        }
        else if (build.exception) {
          reply(Hapi.error.badRequest(build.exception));
          done();
        }

        _.assign(params, {
          testId: test.tests._id,
          query: {tests: {$elemMatch: {_id: test.tests._id}}}
        });

        var updateProps, updateMessages;

        switch (params.type) {
          case 'complete':

            updateProps = {
              'tests.$.status': 'complete',
              'tests.$.completed': new Date(),
              'tests.$.results': testParser.parse(params.results)
            };

            updateMessages = [{
              type: 'info',
              description: 'Testing completed on [' + test.tests.module + '/' + test.tests.suite + ']',
              timestamp: new Date()
            }];

            break;

          case 'cancelled':

            updateProps = {
              'tests.$.status': 'cancelled',
              'tests.$.completed': new Date(),
              'tests.$.results': null
            };

            updateMessages = [{
              type: 'warning',
              description: 'Testing cancelled on [' + test.tests.module + '/' + test.tests.suite + ']',
              timestamp: new Date()
            }];

            break;
        }

        var outstandingTests = _.where(build.tests, function (element) {
          if ((element.status !== 'complete' && element.status !== 'cancelled') &&
            element._id.toString() != test.tests._id.toString())
            return true;
          else
            return false;
        });

        if (outstandingTests.length === 0) {
          updateProps['status'] = 'complete';
          updateProps['deployment.environmentStatus'] = 'finished';
          updateMessages.push({
            type: 'info',
            description: 'Testing finished, environment marked for recycling',
            timestamp: new Date()
          });
        }

        _.assign(params, {
          update: {
            $set: updateProps,
            $push: {
              messages: {$each: updateMessages}
            }
          }
        });

        return updateTest(params);

      }).then(function(data) {
        if (data.exception) {
          reply(Hapi.error.badRequest(data.exception));
        }
        else {
          reply(transformToTest(data));
        }
        done();

      }).catch(function(err) {
        reply(Hapi.error.badImplementation(err));
      });
    },

    query: function query(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      var query = {};

      if (!!params.status) {
        query['tests.status'] = params.status;
      }

      if (!!params.buildId) {
        query['buildId'] = params.buildId;
      }

      _.assign(params, {
        query: query,
        sort: {'tests.queued':1, 'tests.module':1, 'tests.suite':1}
      });

      testDAO.find(params, function(err, data) {
        helper.replyFind(err, _.map(data, transformToTest));
      });
    }
  };

})();

var testController = new TestController();
module.exports = testController;
