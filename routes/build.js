var express = require('express'),
  router = express.Router(),
  moment = require('moment'),
  Build = require('../models/build');

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
    res.status(err ? 500 : 200).send(err || { success: true });
  });
})

module.exports = router;
