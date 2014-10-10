var mongoose = require('mongoose'),
  moment = require('moment');

var testResultSchema = new mongoose.Schema({
  buildId: String,
  module: String,
  submodule: String,
  queued: Date,
  started: Date,
  completed: Date,
  tests: Number,
  passes: Number,
  failures: Number
});

module.exports = mongoose.model('TestResult', testResultSchema, 'testResults');
