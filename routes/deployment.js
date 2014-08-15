var express = require('express'),
    router = express.Router(),
    moment = require('moment'),
    Candidate = require('../models/candidate');

// GET /
router.get('/waiting', function(req, res) {
    var query = Candidate
        .find( { 'deployment.started': null })
        .sort('-buildDate')
        .exec(function(err, results) {
            res.status(err ? 500 : 200).send(results);
        });
});

router.get('/started', function(req, res) {
    var query = Candidate
        .find({ 
            $and: [
                { 'deployment.started': { $ne: null } },
                { 'deployment.completed': null }
            ]
        })
        .sort('-buildDate')
        .exec(function(err, results) {
            res.status(err ? 500 : 200).send(results);
        });
});

router.get('/completed', function(req, res) {
    var query = Candidate
        .find( { 'deployment.completed': { $ne: null } })
        .sort('-buildDate')
        .exec(function(err, results) {
            res.status(err ? 500 : 200).send(results);
        });
});

router.put('/:buildId', function(req, res) {
    console.log('yo');
    Candidate.findOne({'buildId': req.params.buildId}, function(err, candidate) {
            candidate.deployment = req.body;
            console.log(req.body);
            candidate.save(function(err) {
                res.status(err ? 500 : 200).send({message: 'ta'});
            });
        });
});

module.exports = router;
