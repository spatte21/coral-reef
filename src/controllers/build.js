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
      params.query = {};
      params.sort = {
        startTime: 1
      };

      if (!!params.branch) {
        params.query.branch = params.branch;
      }

      if (!!params.buildId) {
        params.query.buildId = params.buildId;
      }

      buildDAO.find(params, function(err, data) {
        helper.replyFind(err, data);
      });
    },

    insert: function insert(request, reply) {

      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);

      buildDAO.insert(params, function(err, data) {
        helper.replyInsert(err, data);
      });
    }
  };

})();

var buildController = new BuildController();
module.exports = buildController;
