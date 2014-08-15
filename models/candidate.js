var mongoose = require('mongoose'),
    moment = require('moment');

// var testReportSchema = new mongoose.Schema({
//     suite: String,
//     summary: {
//         run: Number,
//         passed: Number,
//         failed: Number
//     }
// });

// var logEntrySchema = new mongoose.Schema({
//     timestamp: Date,
//     message: String
// });

// var progressEventSchema = new mongoose.Schema({
//     started: Boolean,
//     startedDate: Date,
//     finished: Boolean,
//     finishedDate: Date,
//     log: [ logEntrySchema ],
//     displayStatus: String
// });

var testSuiteSchema = new mongoose.Schema({
    name: { type: String, default: null},
    started: { type: Date, default: null },
    completed: { type: Date, default: null },
    run: { type: Number, default: 0 },
    passed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    extra: { type: String, default: ''}
});

var candidateSchema = new mongoose.Schema({
    buildId: String,
    branch: String,
    buildDate: { type: Date, default: Date.now },
    deployment: {
        started: { type: Date, default: null },
        completed: { type: Date, default: null },
        hrUrl: { type: String, default: '' },
        recruitmentUrl: { type: String, default: '' },
        mobileUrl: { type: String, default: '' },
        extra: { type: String, default: '' }
    },
    testing: {
        started: { type: Date, default: null },
        completed: { type: Date, default: null },
        suites: [ testSuiteSchema ]
    }
 });

candidateSchema.virtual('status').get(function() {
    var status = 'Unknown';
    if (this.deployment.started === null) {
        status = 'Ready to deploy';
    }
    else if (this.deployment.completed === null) {
        status = 'Deploying';
    }
    else if (this.testing.started === null) {
        status = 'Deployed';
    }
    else if (this.testing.completed === null) {
        status = 'Testing';
    }
    else {
        status = 'Testing Complete';
    }
    return status;
});

candidateSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Candidate', candidateSchema);
