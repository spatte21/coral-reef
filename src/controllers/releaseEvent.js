'use strict';

var ReplyHelper = require('./reply-helper');
var releaseEventDAO = require('../dao/releaseEvent');
var _ = require('lodash');
var moment = require('moment');

function ReleaseEventController(){};
ReleaseEventController.prototype = (function() {

  return {

    findUpcoming: function findUpcoming(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      var upcomingCutoff = moment().add(-14, 'd').toISOString();

      _.assign(params, {
        query: {ends: { $gt: upcomingCutoff }}
      });

      releaseEventDAO.find(params, helper.replyFind.bind(helper));
    },

    insert: function insert(request, reply) {
      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);

      _.assign(params, {
        insert: {
          releaseId: params.releaseId,
          type: params.type,
          starts: params.starts,
          ends: params.ends
        }
      });

      releaseEventDAO.insert(params, helper.replyInsertOne.bind(helper));
    }

  };

})();

var releaseEventController = new ReleaseEventController();
module.exports = releaseEventController;
