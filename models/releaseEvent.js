var mongoose = require('mongoose');

var releaseEventSchema = new mongoose.Schema({
  releaseId: String,
  type: String,
  starts: Date,
  ends: Date
});

module.exports = mongoose.model('ReleaseEvent', releaseEventSchema, 'releaseEvents');
