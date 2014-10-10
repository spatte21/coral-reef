var express = require('express'),
    router = express.Router(),
    moment = require('moment'),
    ObjectId = require('mongoose').Types.ObjectId,
    Deployment = require('../models/deployment'),
    Build = require('../models/build'),
    TestConfiguration = require('../models/testConfiguration'),
    TestResult = require('../models/testResult');

router.get('/queue', function(req, res) {
    var query = Deployment
        .find({
            'started': null
        })
        .sort('queued')
        .exec(function(err, result) {
            console.log(result);
            res.status(err ? 500 : 200).send(err || result);
        });
});

router.get('/queue/next', function(req, res) {
    var query = Deployment
        .findOne({
            'started': null
        })
        .sort('queued')
        .exec(function(err, result) {
            res.status(err ? 500 : 200).send(err || result);
        });
});

router.put('/queue/pop', function(req, res) {
    var now = moment().toISOString();
    var query = Deployment
        .findOneAndUpdate({
            'started': null
        }, {
            'started': now
        }, {
            sort: 'queued'
        })
        .exec(function(err, result) {
            res.status(err ? 500 : 200).send(err || result);
        });
});

router.get('/:deploymentId', function(req, res) {
    var query = Deployment
        .findOne({
            '_id': new ObjectId(req.params.deploymentId)
        })
        .exec(function(err, result) {
            res.status(err ? 500 : 200).send(err || result);
        });
});

router.put('/:buildId', function(req, res) {
    Deployment.findOne({
        'buildId': req.params.buildId
    }, function(err, deployment) {
        deployment.completed = moment();
        deployment.environment = req.body.environment;
        deployment.host = req.body.host;
        deployment.hrPort = req.body.hrPort;
        deployment.orPort = req.body.orPort;
        deployment.moPort = req.body.moPort;
        deployment.snapshotName = req.body.snapshotName;
        deployment.snapshotFile = req.body.snapshotFile;

        deployment.save(function(err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                var deploymentId = result.id;
                Build.findOne({
                    'buildId': req.params.buildId
                }, function(err, build) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        TestConfiguration.findOne({
                            'branch': build.branch
                        }, function(err, testConfig) {
                            if (err) {
                                res.status(500).send(err);
                            } else {
                                var newItems = [];
                                testConfig.suites.forEach(function(element) {
                                    newItems.push(new TestResult({
                                        buildId: build.buildId,
                                        deploymentId: deploymentId,
                                        module: element.module,
                                        submodule: element.submodule,
                                        queued: moment()
                                    }));
                                });

                                TestResult.create(newItems, function(err) {
                                    res.status(err ? 500 : 200).send(err || {
                                        success: true
                                    });
                                })
                            }
                        });
                    }
                });
            }
        });
    });
});

module.exports = router;
