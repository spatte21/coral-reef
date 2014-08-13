var mongoose = require('mongoose');

var testReportSchema = new mongoose.Schema({
    suite: String,
    summary: {
        run: Number,
        passed: Number,
        failed: Number
    }
});

var candidateSchema = new mongoose.Schema({
    buildId: String,
    branch: String,
    buildDate: String,
    status: String,
    results: [testReportSchema]
});

module.exports = mongoose.model('Candidate', candidateSchema);
