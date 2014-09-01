var express = require('express'),
  router = express.Router(),
  moment = require('moment'),
  ReleaseEvent = require('../models/releaseEvent');

// GET /
router.get('/', function(req, res) {
  var query = ReleaseEvent.find();

  if (req.query.status) {
    query = query.where('status').equalsl(req.query.status);
  }

  if (req.query.top) {
    query = query.limit(req.query.top);
  }

  query
    .sort('-buildDate')
    .exec(function(err, results) {
      res.status(err ? 500 : 200).send(results);
    });
});
