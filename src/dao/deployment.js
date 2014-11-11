'use strict';

var DeploymentDAO(){};
DeploymentDAO.prototype = (function() {

  insert: function insert(params, callback) {
    var db = params.db;
    var deployment = {
      buildId: params.buildId,
      branch: params.branch,
      queued: new Date(),
      snapshotName: params.snapshotName,
      snapshotFile: params.snapshotFile,
      status: 'queued'
    };

    db.collection('deployments').insert(deployment, callback);
  }

})();

var deploymentDAO = new DeploymentDAO();
module.exports = deploymentDAO;
