var mongoose = require('mongoose');

var releaseEventSchema = new mongoose.Schema({
  releaseId: type: String,
  type: type: String,
  starts: type: Date,
  ends: type: Date
});

module.exports = mongoose.model('ReleaseEvent', releaseEventSchema, 'releaseEvents');
