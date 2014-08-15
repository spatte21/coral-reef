var express = require('express'),
    router = express.Router(),
    moment = require('moment'),
    Candidate = require('../models/candidate');

// GET /
router.get('/', function(req, res) {
    var query = Candidate
        .find()
        .select('buildId testing')
        .sort('-buildDate')
        .exec(function(err, results) {
            res.status(err ? 500 : 200).send(results);
        });
});

router.put('/:buildId/:module', function(req, res) {

    res.status(200).send({message:'Thanking you kindly', buildId: req.params.buildId, module: req.params.module});

    // Candidate.update({buildId: req.params.id}, { $set: { deployment: req.body } })

    // Candidate.findOne({'buildId': req.params.id}, function(err, candidate) {
    //         candidate.deployment = req.body;
    //         candidate.save(function(err) {
    //             res.status(err ? 500 : 200).send({
    //                 buildId: candidate.buildId,
    //                 deployment: candidate.deployment
    //             });
    //         });
    //     });
});

module.exports = router;
