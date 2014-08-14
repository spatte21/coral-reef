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
    else {
        status = 'Deployed';
    }
    return status;
});

candidateSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Candidate', candidateSchema);
