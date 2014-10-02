var mongoose = require('mongoose'),
    moment = require('moment');

var testListSchema = new mongoose.Schema({
  branch: String,
  is_active: Boolean,
  tests: [String]
});

module.exports = mongoose.model('TestList', testListSchema, 'testLists');
