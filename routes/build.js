var express = require('express'),
  router = express.Router(),
  moment = require('moment'),
  Build = require('../models/build'),
  Deployment = require('../models/deployment'),
  TestResult = require('../models/testResult');

router.get('/', function(req, res) {
  var query = Build.find();

  query
    .sort('-buildDate')
    .exec(function(err, results) {
      res.status(err ? 500 : 200).send(err || results);
    });
});

router.post('/', function(req, res) {
  var build = new Build({
    buildId: req.body.buildId,
    branch: req.body.branch,
    buildDate: moment()
  });

  build.save(function(err) {
    if (err) {
      res.status(500).send(err);
    } else {
      var deployment = new Deployment({
        buildId: req.body.buildId,
        queued: moment()
      });

      deployment.save(function(err, result) {
        res.status(err ? 500 : 200).send(err || result);
      });
    }
  });
});

module.exports = router;
