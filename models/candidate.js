var mongoose = require('mongoose');

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
    status: { type: String, default: 'Ready to Deploy' }
});

module.exports = mongoose.model('Candidate', candidateSchema);
