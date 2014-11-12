'use strict';

var Joi = require('joi');
var releaseEventController = require('../controllers/releaseEvent');

module.exports = function() {
  return [
    {
      method: 'GET',
      path: '/releaseEvent',
      handler: releaseEventController.findUpcoming,
      config: {
        description: 'Returns the set of release events that are upcoming or have ended in the last fortnight'
      }
    }
  ];
}();