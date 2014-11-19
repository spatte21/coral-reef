var Lab = require('lab');
var lab = exports.lab = Lab.script();
var constants = require('../src/config/constants');
var moment = require('moment');

var id = require('pow-mongodb-fixtures').createObjectId;
var fixtures = require('pow-mongodb-fixtures').connect(constants.database.database, {
  host: constants.database.host,
  port: constants.database.port,
  user: constants.database.user,
  pass: constants.database.password
});

var chai = require('chai');
var should = chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-datetime'));

var server;

lab.experiment('When testing the test route...', function() {

  lab.before(function(done) {
    server = require('../');
    fixtures.clear(['builds'], function(err) {
      if (err) {
        console.log(err);
        throw err;
      }
      fixtures.load({
        builds: [
          {
            buildId: '1.2',
            branch: 'one',
            status: 'tests queued',
            deployment: {
              hrUrl: 'http://testsite.hr',
              recruitmentUrl: 'http://testsite.re',
              mobileUrl: 'http://testsite.mo',
              environmentStatus: 'in use'
            },
            tests: [
              {
                _id: id('546a30f78888d194e188bd00'),
                module: 'hr',
                suite: 'screen design',
                status: 'queued',
                queued: moment().add(-10, 'm').toISOString()
              },
              {
                _id: id('546a30f78888d194e188bd01'),
                module: 'hr',
                suite: 'requests',
                status: 'queued',
                queued: moment().add(-11, 'm').toISOString()
              }
            ],
            messages: []
          },
          {
            _id: id('546a30f78888d194e188bdd7'),
            buildId: '3.4',
            branch: 'two',
            status: 'testing',
            deployment: {
              hrUrl: 'http://testsite.hr',
              recruitmentUrl: 'http://testsite.re',
              mobileUrl: 'http://testsite.mo',
              environmentStatus: 'in use'
            },
            tests: [
              {
                _id: id('546a30f78888d194e188bd02'),
                module: 'training',
                suite: 'course booking',
                status: 'testing',
                queued: moment().add(-21, 'm').toISOString()
              },
              {
                _id: id('546a30f78888d194e188bd03'),
                module: 'hr',
                suite: 'requests',
                status: 'complete',
                queued: moment().add(-22, 'm').toISOString(),
                completed: moment().add(-14, 'm').toISOString(),
                resultsText: 'I work'
              },
              {
                _id: id('546a30f78888d194e188bd04'),
                module: 'surveys',
                suite: 'running a survey',
                status: 'queued',
                queued: moment().add(-20, 'm').toISOString()
              }
            ],
            messages: []
          },
          {
            buildId: '5.6',
            branch: 'three',
            status: 'complete',
            deployment: {
              hrUrl: 'http://testsite.hr',
              recruitmentUrl: 'http://testsite.re',
              mobileUrl: 'http://testsite.mo',
              environmentStatus: 'finished'
            },
            tests: [
              {
                _id: id('546a30f78888d194e188bd05'),
                module: 'training',
                suite: 'course booking',
                status: 'complete',
                results: { message: 'lots of passes' },
                queued: moment().add(-43, 'm').toISOString()
              }
            ],
            messages: []
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

  lab.test('pending tests are queued in date order', function(done) {
    server.inject({
      method: 'GET',
      url: '/test/queue'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.equal(3);
      response.result[0]._id.toString().should.equal('546a30f78888d194e188bd04');
      done();
    });
  });

  lab.test('a test can be found by its unique id', function(done) {
    server.inject({
      method: 'GET',
      url: '/test/546a30f78888d194e188bd05'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');
      response.result._id.toString().should.equal('546a30f78888d194e188bd05');
      response.result.status.should.equal('complete');
      response.result.results.should.be.a('object');
      done();
    });
  });

  lab.test('a 404 code is returned when searching for a specific test that does not exist', function(done) {
    server.inject({
      method: 'GET',
      url: '/test/546a30f78888d194e188bd07'
    }, function(response) {
      response.statusCode.should.equal(404);
      done();
    });
  });

  lab.test('the test queue does not contain tests that are completed or in progress', function(done) {
    server.inject({
      method: 'GET',
      url: '/test/queue'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.equal(3);
      response.result.should.not.contain.a.thing.with.property('status', 'complete');
      response.result.should.not.contain.a.thing.with.property('status', 'testing');
      done();
    });
  });

  lab.test('calling peek on the queue returns the next test but does not modify it', function(done) {
    server.inject({
      method: 'GET',
      url: '/test/queue/peek'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');
      response.result._id.toString().should.equal('546a30f78888d194e188bd04');

      server.inject({
        method: 'GET',
        url: '/test/queue'
      }, function(response) {
        response.statusCode.should.equal(200);
        response.result.length.should.equal(3);
        response.result[0]._id.toString().should.equal('546a30f78888d194e188bd04');
        done();
      });
    });
  })

  lab.test('calling pop returns the next test and removes it from the queue', function(done) {
    server.inject({
      method: 'PUT',
      url: '/test/queue/pop'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');
      response.result._id.toString().should.equal('546a30f78888d194e188bd04');
      response.result.status.should.equal('testing');
      var buildId = response.result._parentId;

      server.inject({
        method: 'GET',
        url: '/test/queue'
      }, function(response) {
        response.statusCode.should.equal(200);
        response.result.length.should.equal(2);
        response.result.should.not.contain.a.thing.with.property('suite', 'running a survey');

        server.inject({
          method: 'GET',
          url: '/build/' + buildId
        }, function(response) {
          response.statusCode.should.equal(200);
          response.result.status.should.equal('testing');
          response.result.messages.should.contain.an.item.with.property('description', 'Testing started on [surveys/running a survey]');
          done();
        });
      });
    });
  });

  lab.test('an empty array is returned when no tests are left in the queue', function(done) {
    // pop the last two items off the test queue to leave the queue empty
    server.inject({
      method: 'PUT',
      url: '/test/queue/pop'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');

      server.inject({
        method: 'PUT',
        url: '/test/queue/pop'
      }, function (response) {
        response.statusCode.should.equal(200);
        response.result.should.be.a('object');

        server.inject({
          method: 'GET',
          url: '/test/queue'
        }, function (response) {
          response.statusCode.should.equal(200);
          response.result.should.be.a('array');
          response.result.should.be.empty;
          done();
        });
      });
    });
  });

  lab.test('calling peek returns a 204 code and empty body when no tests are in the queue', function(done) {
    server.inject({
      method: 'GET',
      url: '/test/queue/peek'
    }, function(response) {
      response.statusCode.should.equal(204);
      should.not.exist(response.result);
      done();
    });
  });

  lab.test('calling pop returns a 204 code and empty body when no tests are in the queue', function(done) {
    server.inject({
      method: 'PUT',
      url: '/test/queue/pop'
    }, function(response) {
      response.statusCode.should.equal(204);
      should.not.exist(response.result);
      done();
    });
  });

  lab.test('tests can be queried by status', function(done) {
    server.inject({
      method: 'GET',
      url: '/test?status=complete'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.equal(2);
      done();
    });
  });

  lab.test('tests can be queried by buildId', function(done) {
    server.inject({
      method: 'GET',
      url: '/test?buildId=3.4'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.equal(3);
      done();
    });
  });

  lab.test('tests can be updated when complete', function(done) {
    server.inject({
      method: 'POST',
      url: '/test/546a30f78888d194e188bd04/actions',
      payload: {
        type: 'complete',
        results: { message: 'json' },
        resultsText: 'text'
      }
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');
      response.result.status.should.equal('complete');
      response.result.results.message.should.equal('json');
      response.result.resultsText.should.equal('text');

      server.inject({
        method: 'GET',
        url: '/build/' + response.result._parentId.toString()
      }, function(response) {
        response.statusCode.should.equal(200);
        response.result.status.should.equal('testing');
        response.result.messages.should.contain.an.item.with.property('description', 'Testing completed on [surveys/running a survey]');
        response.result.deployment.environmentStatus.should.equal('in use');
        done();
      });
    });
  });

  lab.test('tests can be cancelled before they are complete', function(done) {
    server.inject({
      method: 'POST',
      url: '/test/546a30f78888d194e188bd02/actions',
      payload: {
        type: 'cancelled'
      }
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');
      response.result.status.should.equal('cancelled');

      server.inject({
        method: 'GET',
        url: '/build/' + response.result._parentId.toString()
      }, function(response) {
        response.statusCode.should.equal(200);
        response.result.status.should.equal('complete');
        response.result.messages.should.contain.an.item.with.property('description', 'Testing cancelled on [training/course booking]');
        response.result.messages.should.contain.an.item.with.property('description', 'Testing finished, environment marked for recycling');
        response.result.deployment.environmentStatus.should.equal('finished');
        done();
      });
    });
  });
});

