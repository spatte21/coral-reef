var mongoose = require('mongoose'),
  moment = require('moment');

var suiteSchema = new mongoose.Schema({
  module: String,
  submodule: String
});

var testConfigurationSchema = new mongoose.Schema({
  branch: String,
  suites: [suiteSchema]
});

module.exports = mongoose.model('TestConfiguration', testConfigurationSchema, 'testConfiguration');
