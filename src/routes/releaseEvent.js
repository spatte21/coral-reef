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
    },
    {
      method: 'POST',
      path: '/releaseEvent',
      handler: releaseEventController.insert,
      config: {
        description: 'Add a new release event to the database',
        validate: {
          payload: {
            releaseId: Joi.string().required().description('The software release Id that this event relates to, e.g. 5.1'),
            type: Joi.string().required().description('The underlying event type, e.g. Regression Testing'),
            starts: Joi.date().description('The start date (and optional time) on which the event starts'),
            ends: Joi.date().description('The end date of the event')
          }
        }
      }
    }
  ];
}();