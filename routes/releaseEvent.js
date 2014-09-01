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
    .sort({starts: 'asc'});


  // if (req.query.status) {
  //   query = query.where('status').equalsl(req.query.status);
  // }

    // if (req.query.top) {
    //   query = query
    //     .where('ends').gt(Date(moment().add('d', -14).toISOString()))
    //     .sort('-ends')
    //     .limit(req.query.top)
    // }  

    query
      .exec(function(err, results) {
        if (err) {
          console.log('!!' + err);
        }
        res.status(err ? 500 : 200).send(results);
      });
});

module.exports = router;