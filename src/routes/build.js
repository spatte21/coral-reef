'use strict';

var Joi = require('joi');
var buildController = require('../controllers/build');

module.exports = function() {
  return [
    {
      method: 'POST',
      path: '/build',
      handler: buildController.insert,
      config: {
        description: 'Creates a new build record',
        notes: 'This method will be called at the end of the publish to store step in TeamCity',
        validate: {
          payload: {
            buildId: Joi.string().description('The build Id as generated by TeamCity, e.g. 5.2.1209'),
            branch: Joi.string().description('The branch on which the build ran, e.g. develop')
          }
        }
      }
    },
    {
      method: 'GET',
      path: '/build/{id}',
      handler: buildController.findById,
      config: {
        description: 'Returns a specific build record with the supplied internal _id',
        validate: {
          params: {
            id: Joi.string().description('The unique _id (a mongo ObjectId) of the build record')
          }
        }
      }
    },
    {
      method: 'GET',
      path: '/build',
      handler: buildController.find,
      config: {
        description: 'Returns build records matching the filters supplied on the query string',
        validate: {
          query: {
            buildId: Joi.string().optional().description('If supplied will return the build with this buildId, e.g. 5.1.4343'),
            branch: Joi.string().optional().description('If supplied will return builds belonging to this branch, e.g. develop')
          }
        }
      }
    },
  ];
}();
