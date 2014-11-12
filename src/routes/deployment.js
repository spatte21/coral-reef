'use strict';

var Joi = require('joi');
var deploymentController = require('../controllers/deployment');

module.exports = function() {
  return [
    {
      method: 'GET',
      path: '/deployment/queue',
      handler: deploymentController.queue,
      config: {
        description: 'Returns the queue of deployment records'
      }
    },
    {
      method: 'GET',
      path: '/deployment/queue/peek',
      handler: deploymentController.queuePeek,
      config: {
        description: 'Returns the deployment at the head of the queue but without marking it as deploying, i.e. leaving it in the queue'
      }
    },
    {
      method: 'PUT',
      path: '/deployment/queue/pop',
      handler: deploymentController.queuePop,
      config: {
        description: 'Returns the deployment at the head of the queue, marking it as deploying, and hence removing it from the queue'
      }
    },
    {
      method: 'POST',
      path: '/deployment/{id}/actions',
      handler: deploymentController.performAction,
      config: {
        description: 'General purpose endpoint for performing actions against a deployment record, e.g. completing it',
        validate: {
          params: {
            id: Joi.string().description('The unique _id (a mongo ObjectId) of the deployment record')
          },
          payload: {
            type: Joi.string().regex(/complete|failed|environment-recycled/).description('The action to perform. Supported actions: \'complete\', \'failed\', \'environment-recycled\''),
            environment: Joi.string().optional().description('The environment on which the deploy was performed, e.g. Capri'),
            hrUrl: Joi.string().optional().description('The url of the HR application'),
            recruitmentUrl: Joi.string().optional().description('The url of the Online Recruitment application'),
            mobileUrl: Joi.string().optional().description('The url of the Mobile application'),
            snapshotName: Joi.string().optional().description('The name of the data snapshot used in the deployment'),
            snapshotFile: Joi.string().optional().description('The filename of the data snapshot used in the deployment'),
            octopusDeploymentId: Joi.string().optional().description('The deployment ID in Octopus Deploy')
          }
        }
      }
    },
    {
      method: 'GET',
      path: '/deployment/{id}',
      handler: deploymentController.findById,
      config: {
        description: 'Returns the deployment record with the internal _id value supplied',
        validate: {
          params: {
            id: Joi.string().description('The unique _id (a mongo ObjectId) of the deployment record')
          }
        }
      }
    },
    {
      method: 'GET',
      path: '/deployment',
      handler: deploymentController.query,
      config: {
        description: 'Returns deployment records matching the filters supplied on the query string',
        validate: {
          query: {
            environmentStatus: Joi.string().optional().description('If supplied will return the deployment with this environment status, e.g. in use')
          }
        }
      }
    }
  ];
}();
