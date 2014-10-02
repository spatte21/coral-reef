var express = require('express'),
  router = express.Router(),
  moment = require('moment'),
  Build = require('../models/build'),
  TestList = require('../models/testList'),
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
    }
    else {
      TestList.where({'branch':build.branch}).findOne(function(err, testList) {
        if (err) {
          res.status(500).send(err);
        }
        else {
          var newItems = [];
          testList.tests.forEach(function(element) {
            newItems.push(new TestResult({
              buildId: build.buildId,
              suite: element,
              queued: moment()
            }));
          });

          TestResult.create(newItems, function(err) {
            res.status(err ? 500 : 200).send(err || { success: true });
          })
        }
      });
    }
  });
});

module.exports = router;
