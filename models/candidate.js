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

var testStatsSchema = new mongoose.Schema({
    module: { type: String, default: null},
    stats: {
        suites: { type: Number, default: 0 },
        tests: { type: Number, default: 0 },
        passes: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        failures: { type: Number, default: 0 },
        start: { type: Date, default: null },
        end: { type: Date, default: null },
        duration: { type: Number, default: 0 }
    },
    resultsFile: { type: String, default: null },
    logFiles: [ String ]
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
        tests: [ testStatsSchema ]
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
