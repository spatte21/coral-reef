var Hapi = require('hapi');

function ReplyHelper(request, reply) {
  this.request = request;
  this.reply = reply;
};

ReplyHelper.prototype.replyQueue = function replyQueue(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }
  else if (!!data && data.length > 0) {
    this.reply(data);
  }
  else {
    this.reply([]);
  }
};

ReplyHelper.prototype.replyFindOne = function replyFindOne(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }
  else if (!!data) {
    this.reply(data);
  }
  else {
    this.reply(Hapi.error.notFound('No record found'));
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
    this.reply(Hapi.error.notFound('No record found'));
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

ReplyHelper.prototype.replyInsertOne = function replyInsertOne(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }
  else {
    this.reply(data[0]);
  }
};

ReplyHelper.prototype.replyInsertMany = function replyInsertMany(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }
  else {
    this.reply(data);
  }
};

ReplyHelper.prototype.replyRemove = function replyRemove(err, data) {
  if (err) {
    return this.reply(Hap.error.badImplementation(err));
  }
  else if (data === 0) {
    return this.reply(Hapi.error.notFound('No record found'));
  }
  else {
    this.reply(data);
  }
};

ReplyHelper.prototype.replyUpdate = function replyUpdate(err, data) {
  if (err) {
    return this.reply(Hapi.error.badImplementation(err));
  }
  else if (!data) {
    this.reply(Hapi.error.notFound('No record found'));
  }
  else {
    this.reply(data);
  }
};

module.exports = ReplyHelper;
