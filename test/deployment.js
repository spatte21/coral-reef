var Lab = require('lab');
var lab = exports.lab = Lab.script();
var constants = require('../src/config/constants');
var moment = require('moment');

var fixtures = require('pow-mongodb-fixtures').connect(constants.database.database, {
  host: constants.database.host,
  port: constants.database.port,
  user: constants.database.user,
  pass: constants.database.password
});

var chai = require('chai');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-datetime'));

var server;

lab.experiment('When testing the deployment route...', function() {

  lab.before(function(done) {
    server = require('../');
    fixtures.clear(['builds'], function(err) {
      if (err) {
        console.log(err);
        throw err;
      }
      fixtures.load({
      }, function(err) {
        if (err) {
          console.log(err);
          throw err;
        }

        setTimeout(function() {
          done();
        }, 1000);
      });
    });
  });

  lab.test('1 is 1', function(done) {
    var number = 1;
    number.should.equal(1);
    done();
  });

});

