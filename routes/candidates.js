var express = require('express'),
    router = express.Router(),
    Candidate = require('../models/candidate');

/* GET users listing. */
router.get('/', function(req, res) {
    Candidate
        .find()
        .limit(12)
        .sort('-buildId')
        .exec(function(err, results) {
        if (err) {
            console.log(err);
        }
        res.send(results);
    });
});

router.post('/', function(req, res) {
    console.log(req.body)
    res.send({ message: 'done'});
});

module.exports = router;
