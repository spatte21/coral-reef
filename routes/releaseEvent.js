var express = require('express'),
  router = express.Router(),
  moment = require('moment'),
  ReleaseEvent = require('../models/releaseEvent'),
  Candidate = require('../models/candidate');

// GET /
router.get('/', function(req, res) {
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
});

router.post('/', function(req, res) {
  var releaseEvent = new ReleaseEvent(req.body);

  releaseEvent.save(function(err) {
    res.status(err ? 500 : 200).send(err || { success: true });
  });
})

module.exports = router;
