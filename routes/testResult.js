var express = require('express'),
  router = express.Router(),
  moment = require('moment'),
  TestResult = require('../models/testResult');

router.get('/queue/next', function(req, res) {
  var query = TestResult
    .findOne({
      'started': null
    })
    .sort('queued')
    .exec(function(err, result) {
      res.status(err ? 500 : 200).send(err || result);
    });
});

router.post('/', function(req, res) {
  res.status(200).send(req.body);
});

module.exports = router;
