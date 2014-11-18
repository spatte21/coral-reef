'use strict';

var ReplyHelper = require('./reply-helper');
var buildDAO = require('../dao/build');
var testConfigurationDAO = require('../dao/testConfiguration');
var dataConfigurationDAO = require('../dao/dataConfiguration');
var _ = require('lodash');
var Q = require('q');

function BuildController(){};
BuildController.prototype = (function() {

  return {
    findById: function findById(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);

      _.assign(params, {
        query: {_id: new params.ObjectID(params.id)}
      });

      buildDAO.findById(params, helper.replyFindOne.bind(helper));
    },

    find: function find(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);

      buildDAO.find(params, helper.replyFind.bind(helper));
    },

    remove: function remove(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);

      buildDAO.remove(params, helper.replyRemove.bind(helper));
    },

    insert: function insert(request, reply) {
      var params = request.plugins.createControllerParams(request);
      var insertBuild = Q.nfbind(buildDAO.insert);
      var findTests = Q.nfbind(testConfigurationDAO.findByBranch);
      var findData = Q.nfbind(dataConfigurationDAO.find);

      var newBuild = {
        buildId: params.buildId,
        branch: params.branch,
        startTime: new Date(),
        messages: []
      };

      var configuredTests;
      var snapshotData;

      findTests(params).then(function(data) {
        configuredTests = data;
        return findData(params);

      }).then(function(data) {
        snapshotData = data;

        if (!!configuredTests && configuredTests.length > 0) {
          var snapshot = _.find(snapshotData, {branch: params.branch});
          if (!snapshot) {
            snapshot = _.find(snapshotData, {branch: 'default'});
          }

          newBuild.status = 'deployment queued';
          newBuild.deployment = {
            queued: new Date(),
            snapshotName: snapshot.snapshotName,
            snapshotFile: snapshot.snapshotFile,
            status: 'queued'
          };
          newBuild.messages.push({
            type: 'info',
            description: 'Deployment queued',
            timestamp: new Date()
          });
        }
        else {
          newBuild.status = 'not for testing';
          newBuild.messages.push({
            type: 'warning',
            description: 'There were no tests configured to be run against this branch',
            timestamp: new Date()
          });
        }

        _.assign(params, { insert: newBuild });
        return insertBuild(params);

      }).then(function(data) {
        if (data.exception) {
          reply(Hapi.error.badRequest(data.exception));
        }
        else {
          reply(data[0]);
        }
        done();

      }).catch(function(err) {
        reply(Hapi.error.badImplementation(err));
      });
    }
  };

})();

var buildController = new BuildController();
module.exports = buildController;
