var Hap = require('hapi');
var Q = require('q');
var _ = require()
var ReplyHelper = require('./reply-helper');
var buildDAO = require('../dao/build');
var deploymentDAO = require('../dao/deployment');
var dataConfigurationDAO = require('../dao/dataConfiguration');

function BuildController(){};
BuildController.prototype = (function() {

  return {
    findById: function findById(request, reply) {

      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);

      params.query = {
        id: new params.ObjectID(params.id)
      };

      buildDAO.findOne(params, helper.replyFindOne);
    },

    query: function query(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      params.query = {};
      params.sort = {
        startTime: 1
      }

      if (!!params.branch) {
        params.query.branch = params.branch;
      }

      if (!!params.buildId) {
        params.query.buildId = params.buildId;
      }

      buildDAO.find(params, helper.replyFind);
    },

    insert: function insert(request, reply) {

      var build;
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);

      buildDAO.insert(params, helper.replyInsert);
    }
  };

});

var buildController = new BuildController();
module.exports = buildController;
