var express = require('express'),
  router = express.Router(),
  moment = require('moment'),
  Candidate = require('../models/candidate'),
  _ = require('lodash');

router.get('/:branch', function(req, res) {
  var query = Candidate
    .find({
      'branch': req.params.branch
    })
    .where('testing.started').ne(null)
    .sort('-buildDate')
    .limit(5)
    .exec(function(err, results) {
      if (err) {
        console.log('Grrr... ' + err);
      }

      var forecasts = _.map(results, function(candidate) {

        var forecast = {
          branch: candidate.branch,
          buildId: candidate.buildId,
          buildDate: candidate.buildDate,
          testingStarted: candidate.testing.started,
          failures: 0,
          tests: 0
        };

        _.forEach(candidate.testing.tests, function(test) {
          forecast.failures += test.stats.failures;
          forecast.tests += test.stats.tests;
        });

        return forecast;
      })

      res.status(err ? 500 : 200).send(forecasts);
    });
});

module.exports = router;
