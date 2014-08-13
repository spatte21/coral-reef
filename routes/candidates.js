var express = require('express'),
    router = express.Router(),
    moment = require('moment'),
    Candidate = require('../models/candidate');

/* GET users listing. */
router.get('/', function(req, res) {
    Candidate
        .find()
        .limit(10)
        .sort('-buildId')
        .exec(function(err, results) {
        if (err) {
            console.log(err);
        }
        res.send(results);
    });
});

router.post('/', function(req, res) {
    var candidate = new Candidate({
        buildId: req.body.buildId,
        branch: req.body.branch,
        buildDate: moment().format('yyyy-MM-dd HH:mm:ss'),
        status: 'ready'
    });

    candidate.save(function(err) {
        if (err) {
            res.send({ error: err });
        }
        else {
            res.send(candidate);
        }
    })
});

module.exports = router;
