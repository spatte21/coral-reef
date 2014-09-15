var express = require('express'),
  router = express.Router(),
  moment = require('moment'),
  ReleaseEvent = require('../models/releaseEvent'),
  Candidate = require('../models/candidate');

// GET /
router.get('/', function(req, res) {
  var secret_key = req.query.shush;
  if (!secret_key || secret_key !== process.env.WEBSITE_SECRET_KEY) {
    res.status(403).send("Not authorised");
  } else {
    var query = ReleaseEvent
      .find()
      .where('ends').gt(Date(moment().add('d', -14).toISOString()))
      .sort({
        starts: 'asc'
      });

    query
      .exec(function(err, results) {
        if (err) {
          console.log('!!' + err);
        }
        res.status(err ? 500 : 200).send(results);
      });
  }
});

module.exports = router;
