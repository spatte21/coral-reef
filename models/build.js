var mongoose = require('mongoose'),
  moment = require('moment');

var buildSchema = new mongoose.Schema({
  buildId: String,
  branch: String,
  buildDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Build', buildSchema);
