var express = require('express'),
  path = require('path'),
  logger = require('morgan'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  cors = require('cors');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cors());

app.use(function(req, res, next) {
  var secret_key = req.query.shush;
  if (!secret_key || secret_key !== process.env.WEBSITE_SECRET_KEY) {
    res.status(403).send("Not authorised");
  } else {
    next();
  }
});

app.use('/build', require('./routes/build'));
app.use('/deployment', require('./routes/deployment'));
app.use('/testResult', require('./routes/testResult'));
app.use('/releaseEvent', require('./routes/releaseEvent'));
//app.use('/weatherForecast', require('./routes/weatherForecast'));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});

module.exports = app;
