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

    query: function query(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      var query = {};

      if (!!params.branch) {
        query.branch = params.branch;
      }

      if (!!params.buildId) {
        query.buildId = params.buildId;
      }

      _.assign(params, {
        query: query,
        sort: { startTime: 1 }
      });

      buildDAO.find(params, helper.replyFind.bind(helper));
    },

    insert: function insert(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);

      _.assign(params, {
        insert: {
          buildId: params.buildId,
          branch: params.branch,
          startTime: new Date()
        }
      });

      buildDAO.insert(params, helper.replyInsert.bind(helper));
    }
  };

})();

var buildController = new BuildController();
module.exports = buildController;
