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

lab.experiment('When testing the releaseEvent route...', function() {

  lab.before(function(done) {
    server = require('../');
    fixtures.clear(['releaseEvents'], function(err) {
      if (err) {
        console.log(err);
        throw err;
      }
      fixtures.load({
        releaseEvents: [
          {
            releaseId: '5.1',
            type: 'Development',
            starts: new Date(moment().add(-60, 'd').toISOString()),
            ends: new Date(moment().add(-50, 'd').toISOString())
          },
          {
            releaseId: '5.1',
            type: 'Testing',
            starts: new Date(moment().add(-40, 'd').toISOString()),
            ends: new Date(moment().add(-30, 'd').toISOString())
          },
          {
            releaseId: '5.2',
            type: 'Development',
            starts: new Date(moment().add(-20, 'd').toISOString()),
            ends: new Date(moment().add(-10, 'd').toISOString())
          },
          {
            releaseId: '5.2',
            type: 'Testing',
            starts: new Date(moment().add(0, 'd').toISOString()),
            ends: new Date(moment().add(10, 'd').toISOString())
          }
        ]
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

  lab.test('all events can be queried', function(done) {
    server.inject({
      method: 'GET',
      url: '/releaseEvent'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.equal(2);
      done();
    });
  });

  lab.test('a new event can be inserted', function(done) {
    server.inject({
      method: 'POST',
      url: '/releaseEvent',
      payload: {
        releaseId: '5.3',
        type: 'External Release',
        starts: moment().add(20, 'd').toISOString(),
        ends: moment().add(30, 'd').toISOString()
      }
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.releaseId.should.equal('5.3');
      response.result._id.should.not.equal(null);
      done();
    });
  });

  lab.test('a 400 code is returned when the payload is invalid', function(done) {
    server.inject({
      method: 'POST',
      url: '/releaseEvent',
      payload: {
        releaseId: '5.3',
        starts: moment().add(20, 'd').toISOString(),
        ends: moment().add(30, 'd').toISOString()
      }
    }, function(response) {
      response.statusCode.should.equal(400);
      response.result.validation.keys.should.contain('type');
      done();
    });
  });


});

