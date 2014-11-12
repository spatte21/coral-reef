'use strict';

var Joi = require('joi');
var testController = require('../controllers/test');

module.exports = function() {
  return [
    {
      method: 'GET',
      path: '/test/queue',
      handler: testController.queue,
      config: {
        description: 'Returns the queue of tests that are waiting to be performed'
      }
    },
    {
      method: 'GET',
      path: '/test/queue/peek',
      handler: testController.queuePeek,
      config: {
        description: 'Returns the test at the head of the queue but without marking it as testing, i.e. leaving it in the queue'
      }
    },
    {
      method: 'PUT',
      path: '/test/queue/pop',
      handler: testController.queuePop,
      config: {
        description: 'Returns the test at the head of the queue, marking it as testing, and hence removing it from the queue'
      }
    },
    {
      method: 'GET',
      path: '/test/{id}',
      handler: testController.findById,
      config: {
        description: 'Returns the deployment record with the internal _id value supplied',
        validate: {
          params: {
            id: Joi.string().description('The unique _id (a mongo ObjectId) of the test record')
          }
        }
      }
    },
    {
      method: 'POST',
      path: '/test/{id}/actions',
      handler: testController.performAction,
      config: {
        description: 'General purpose endpoint for performing actions against a deployment record, e.g. completing it',
        validate: {
          params: {
            id: Joi.string().description('The unique _id (a mongo ObjectId) of the test record')
          },
          payload: {
            type: Joi.string().regex(/complete/).description('The action to perform. Supported actions: \'complete\''),
            results: Joi.object().optional().description('The results of the test expressed as a string that will parse to a JSON object'),
            resultsText: Joi.string().optional().description('The results of the test expressed as a string (for non-JSON results)')
          }
        }
      }
    }
  ];
}();
