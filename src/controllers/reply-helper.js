var Hapi = require('hapi');

function ReplyHelper(request, reply) {
  this.request = request;
  this.reply = reply;
};

ReplyHelper.prototype.replyFindOne = function replyFindOne(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }

  if (data[0]) {
    this.reply(data[0]);
  }
  else {
    this.reply().code(404);
  }
}

ReplyHelper.prototype.replyFind = function replyFind(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }
  this.reply(data);
};

ReplyHelper.prototype.replyInsert = function replyInsert(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }
  this.reply(data);
}

module.exports = ReplyHelper;
