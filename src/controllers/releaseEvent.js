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
        query: {ends: { $gte: new Date(upcomingCutoff) }}
      });

      releaseEventDAO.find(params, function(err, data) {
        helper.replyFind(err, data);
      });
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
