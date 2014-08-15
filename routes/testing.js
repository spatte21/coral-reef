var express = require('express'),
    router = express.Router(),
    moment = require('moment'),
    Candidate = require('../models/candidate');

// GET /
router.get('/waiting', function(req, res) {
    var query = Candidate
        .find({
            $and: [
                { 'deployment.completed': { $ne: null } },
                { 'testing.started': null }
            ]
        })
        .sort('-buildDate')
        .exec(function(err, results) {
            res.status(err ? 500 : 200).send(results);
        });
});

router.get('/started', function(req, res) {
    var query = Candidate
        .find({ 
            $and: [
                { 'testing.started': { $ne: null } },
                { 'testing.completed': null }
            ]
        })
        .sort('-buildDate')
        .exec(function(err, results) {
            res.status(err ? 500 : 200).send(results);
        });
});

router.get('/completed', function(req, res) {
    var query = Candidate
        .find( { 'testing.completed': { $ne: null } })
        .sort('-buildDate')
        .exec(function(err, results) {
            res.status(err ? 500 : 200).send(results);
        });
});

router.put('/:buildId/:module', function(req, res) {

    Candidate.findOne({'buildId': req.params.id}, function(err, candidate) {
            if (candidate.testing.started === null) {
                candidate.testing.started = moment();
            }
            candidate.testing.tests.push({
                module: req.params.module,
                stats: req.body.stats
            })
            candidate.save(function(err) {
                res.status(err ? 500 : 200).send({message: 'ta'});
            });
        });
});

module.exports = router;
