'use strict';

var ReplyHelper = require('./reply-helper');
var buildDAO = require('../dao/build');
var _ = require('lodash');

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

    insert: function insert(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);

      var result;
      var insertBuild = Q.nfbind(buildDAO.insert);
      var findTests = Q.nfbind(testConfigurationDAO.findByBranch);
      var findData = Q.nfbind(dataConfigurationDAO.find);
      var insertDeployment = Q.nfbind(deploymentDAO.insert);

      _.assign(params, {
        insert: {
          buildId: params.buildId,
          branch: params.branch,
          startTime: new Date()
        }
      });

      insertBuild(params).then(function(data) {
        result = data;
        if (result.exception) {
          reply(Hapi.error.badRequest(result.exception));
          done();
        }
        return findTests(params);

      }).then(function(data) {
        // make sure there are some tests to run
        if (!!data && data.length > 0) {
          return findData(params);
        }
        else {
          // No need to do anything else as there are no tests configured for this branch
          reply(result);
          done();
        }

      }).then(function(data) {
        // get the snapshot data files we should use for this branch
        if (data.exception) {
          reply(Hapi.error.badRequest(data.exception));
          done();
        }

        var snapshot = _.find(data, {branch: params.branch});
        if (!snapshot) {
          snapshot = _.find(data, {branch: 'default'});
        }

        _.assign(params, {
          insert: {
            buildId: params.buildId,
            branch: params.branch,
            queued: new Date(),
            snapshotName: snapshot.snapshotName,
            snapshotFile: snapshot.snapshotFile,
            status: 'queued'
          }
        });
        return insertDeployment(params);

      }).then(function(data) {
        // return if all is well
        if (data.exception) {
          reply(Hapi.error.badRequest(data.exception));
        }
        else {
          result.deployments = data;
          reply(result);
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
