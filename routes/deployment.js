var express = require('express'),
  router = express.Router(),
  moment = require('moment'),
  Deployment = require('../models/deployment'),
  Build = require('../models/build'),
  TestConfiguration = require('../models/testConfiguration'),
  TestResult = require('../models/testResult');

router.get('/queue', function(req, res) {
  var query = Deployment
    .find({
      'started': null
    })
    .sort('queued')
    .exec(function(err, result) {
      console.log(result);
      res.status(err ? 500 : 200).send(err || result);
    });
});

router.get('/queue/next', function(req, res) {
  var query = Deployment
    .findOne({
      'started': null
    })
    .sort('queued')
    .exec(function(err, result) {
      res.status(err ? 500 : 200).send(err || result);
    });
});

router.put('/queue/pop', function(req, res) {
  var now = moment().toISOString();
  var query = Deployment
    .findOneAndUpdate({
      'started': null
    }, {
      'started': now
    }, {
      sort: 'queued'
    })
    .exec(function(err, result) {
      res.status(err ? 500 : 200).send(err || result);
    });
});

router.get('/:buildId', function(req, res) {
  var query = Deployment
    .find({
      'buildId': req.params.buildId
    })
    .sort('started')
    .exec(function(err, result) {
      res.status(err ? 500 : 200).send(err || result);
    });
});

router.put('/:buildId', function(req, res) {
  Deployment.findOne({
    'buildId': req.params.buildId
  }, function(err, deployment) {
    deployment.completed = moment();
    deployment.environment = req.body.environment;
    deployment.hrUrl = req.body.hrUrl;
    deployment.onlineRecruitmentUrl = req.body.onlineRecruitmentUrl;
    deployment.mobileUrl = req.body.mobileUrl;
    deployment.snapshotName = req.body.snapshotName;
    deployment.snapshotFile = req.body.snapshotFile;

    deployment.save(function(err, result) {
      if (err) {
        res.status(500).send(err);
      } else {
        console.log(deployment.id);
        Build.findOne({
          'buildId': req.params.buildId
        }, function(err, build) {
          console.log(build);
          if (err) {
            res.status(500).send(err);
          } else {
            TestConfiguration.findOne({
              'branch': build.branch
            }, function(err, testConfig) {
              if (err) {
                res.status(500).send(err);
              } else {
                var newItems = [];
                console.log(testConfig);
                testConfig.suites.forEach(function(element) {
                  newItems.push(new TestResult({
                    buildId: build.buildId,
                    module: element.module,
                    submodule: element.submodule,
                    queued: moment()
                  }));
                });

                TestResult.create(newItems, function(err) {
                  res.status(err ? 500 : 200).send(err || {
                    success: true
                  });
                })
              }
            });
          }
        });
      }
    });
  });
});

module.exports = router;
