var express = require('express'),
    router = express.Router(),
    moment = require('moment'),
    Candidate = require('../models/candidate');

// GET /
router.get('/', function(req, res) {
    var query = Candidate.find();

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

router.get('/:id', function(req, res) {
    var query = Candidate
        .findOne({
            'buildId': req.params.id
        })
        .sort('-buildDate')
        .exec(function(err, result) {
            res.status(err ? 500 : 200).send(result);
        });
});

// POST /
router.post('/', function(req, res) {

    var candidate = new Candidate({
        buildId: req.body.buildId,
        branch: req.body.branch,
        buildDate: moment()
    });

    candidate.save(function(err) {
        res.status(err ? 500 : 200).send({message: 'ta'});
    });
});

module.exports = router;
