var mongoose = require('mongoose');
var moment = require('moment');

var deploymentSchema = new mongoose.Schema({
  buildId: String,
  queued: Date,
  started: Date,
  completed: Date,
  environment: String,
  hrUrl: String,
  onlineRecruitmentUrl: String,
  mobileUrl: String,
  snapshotName: String,
  snapshotFile: String
});

module.exports = mongoose.model('Deployment', deploymentSchema);