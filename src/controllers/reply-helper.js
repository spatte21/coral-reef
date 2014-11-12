var Hapi = require('hapi');

function ReplyHelper(request, reply) {
  this.request = request;
  this.reply = reply;
};

ReplyHelper.prototype.replyFindOne = function replyFindOne(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }
  else if (!!data) {
    this.reply(data);
  }
  else {
    this.reply().code(404);
  }
};

ReplyHelper.prototype.replyFindFirst = function replyFindFirst(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }
  else if (!!data && data.length > 0) {
    this.reply(data[0]);
  }
  else {
    this.reply().code(404);
  }
};

ReplyHelper.prototype.replyFind = function replyFind(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }
  else {
    this.reply(data);
  }
};

ReplyHelper.prototype.replyInsert = function replyInsert(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }
  else {
    this.reply(data);
  }
};

ReplyHelper.prototype.replyUpdate = function replyUpdate(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }
  else {
    this.reply(data);
  }
};

module.exports = ReplyHelper;
