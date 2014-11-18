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
var should = chai.should();
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
        builds: [
          {
            buildId: '1.2',
            branch: 'one',
            status: 'tests queued',
            deployment: {
              queued: moment().add(-20, 'm').toISOString(),
              status: 'complete',
              snapshotFile: 'a',
              snapshotName: 'b'
            }
          },
          {
            buildId: '3.4',
            branch: 'two',
            status: 'deployment queued',
            deployment: {
              queued: moment().add(-15, 'm').toISOString(),
              status: 'queued',
              snapshotFile: 'a',
              snapshotName: 'b'
            }
          },
          {
            buildId: '5.6',
            branch: 'three',
            status: 'deployment queued',
            deployment: {
              queued: moment().add(-1, 'm').toISOString(),
              status: 'queued',
              snapshotFile: 'a',
              snapshotName: 'b'
            }
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

  lab.test('new deployments are queued in date order', function(done) {
    server.inject({
      method: 'GET',
      url: '/deployment/queue'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.equal(2);
      response.result[0].buildId.should.equal('3.4');
      done();
    });
  });

  lab.test('completed and in progress deployments are not present in the queue', function(done) {
    server.inject({
      method: 'GET',
      url: '/deployment/queue'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.should.not.contain.a.thing.with.property('buildId', '1.2');
      done();
    });
  });

  lab.test('calling peek returns the next deployment in the queue and does not modify it', function(done) {
    server.inject({
      method: 'GET',
      url: '/deployment/queue/peek'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');
      response.result.buildId.should.equal('3.4');

      server.inject({
        method: 'GET',
        url: '/deployment/queue'
      }, function(response) {
        response.result[0].buildId.should.equal('3.4');
        done();
      });
    });
  });

  lab.test('calling pop returns the next deployment and removes it from the queue', function(done) {
    server.inject({
      method: 'PUT',
      url: '/deployment/queue/pop'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');
      response.result.buildId.should.equal('3.4');

      server.inject({
        method: 'GET',
        url: '/deployment/queue'
      }, function(response) {
        response.result.length.should.equal(1);
        response.result.should.not.contain.a.thing.with.property('buildId', '3.4');
        done();
      });
    });
  });

  lab.test('an empty array is returned when no deployments remain queued', function(done) {
    // pop the last item off the deployment queue to leave the queue empty
    server.inject({
      method: 'PUT',
      url: '/deployment/queue/pop'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');

      server.inject({
        method: 'GET',
        url: '/deployment/queue'
      }, function(response) {
        response.statusCode.should.equal(200);
        response.result.should.be.a('array');
        response.result.should.be.empty;
        done();
      });
    });
  });

  lab.test('calling peek returns null when no deployments are in the queue', function(done) {
    server.inject({
      method: 'GET',
      url: '/deployment/queue/peek'
    }, function(response) {
      response.statusCode.should.equal(204);
      should.not.exist(response.result);
      done();
    });
  });

  lab.test('calling pop returns null when no deployments are in the queue', function(done) {
    server.inject({
      method: 'PUT',
      url: '/deployment/queue/pop'
    }, function(response) {
      response.statusCode.should.equal(204);
      should.not.exist(response.result);
      done();
    });
  });


  //lab.test('deployments can be queried by status')
  //
  //lab.test('deployments can be queried by buildId')
  //
  //lab.test('deployments can be updated when complete')
  //
  //lab.test('deployments can be updated when failed')
  //
  //lab.test('deployments can be updated when cancelled')
  //
  //lab.test('deployments can be updated when their environment has been recycled')

});

