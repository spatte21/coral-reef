var mongoose = require('mongoose');

var releaseEventSchema = new mongoose.Schema({
  version: { type: String },
  type: { type: String },
  starts: { type: Date },
  ends: { type: Date }
});

module.exports = mongoose.model('ReleaseEvent', releaseEventSchema);