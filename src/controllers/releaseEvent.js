'use strict';

var ReplyHelper = require('./reply-helper');
var releaseEventDAO = require('../dao/releaseEvent');
var _ = require('lodash');

function ReleaseEventController(){};
ReleaseEventController.prototype = (function() {

  return {

    findUpcoming: function findUpcoming(request, reply) {

      var helper = new ReplyHelper(request, reply);
      var params = request.plugins.createControllerParams(request);
      _.assign(params, {
        query: {ends: { $gt: new Date(moment().add(-14, 'd').toISOString()) }}
      });

      releaseEventDAO.find(params, helper.replyFind.bind(helper));
    }

  };

})();

var releaseEventController = new ReleaseEventController();
module.exports = releaseEventController;
