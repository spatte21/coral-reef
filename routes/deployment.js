var express = require('express'),
    router = express.Router(),
    moment = require('moment'),
    Candidate = require('../models/candidate');

// GET /
// router.get('/', function(req, res) {
//     var query = Candidate
//         .find()
//         .sort('-buildId')
//         .exec(function(err, results) {
//             if (err) {
//                 console.log(err);
//             }
//             res.send(results);
//         });
// });

module.exports = router;
