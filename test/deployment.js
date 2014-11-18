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
            _id: id('546a30f78888d194e188bdd7'),
            buildId: '3.4',
            branch: 'two',
            status: 'deployment queued',
            deployment: {
              queued: moment().add(-15, 'm').toISOString(),
              status: 'queued',
              snapshotFile: 'c',
              snapshotName: 'd'
            }
          },
          {
            buildId: '5.6',
            branch: 'three',
            status: 'deployment queued',
            deployment: {

              queued: moment().add(-1, 'm').toISOString(),
              status: 'queued',
              snapshotFile: 'e',
              snapshotName: 'f'
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

  lab.test('a deployment can be found by its unique id', function(done) {
    server.inject({
      method: 'GET',
      url: '/deployment/546a30f78888d194e188bdd7'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');
      response.result.buildId.should.equal('3.4');
      response.result.snapshotName.should.equal('c');
      done();
    });
  });

  lab.test('a 404 code is returned when searching for a specific deployment that does not exist', function(done) {
    server.inject({
      method: 'GET',
      url: '/deployment/abca30f78888d194e188bdd6'
    }, function(response) {
      response.statusCode.should.equal(404);
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

  lab.test('deployments can be queried by status', function(done) {
    server.inject({
      method: 'GET',
      url: '/deployment?status=deploying'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.equal(2);
      done();
    });
  });

  
  lab.test('deployments can be queried by buildId', function(done) {
    server.inject({
      method: 'GET',
      url: '/deployment?buildId=5.6'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.equal(1);
      response.result[0].branch.should.equal('three');
      done();
    });
  });

  lab.test('deployments can be updated when complete', function(done) {
    server.inject({
      method: 'POST',
      url: '/deployment/546a30f78888d194e188bdd7/action',
      payload: {
        type: 'complete',
        environment: 'capri',
        hrUrl: 'http://testsite.com',
        recruitmentUrl: 'http://testsite.com:84',
        mobileUrl: 'http://testsite.com:86',
        octopusDeploymentId: 'abcd1234'
      }
    }, function(response) {
        response.statusCode.should.equal(200);
        response.result.should.be.a('object');
        response.result.status.should.equal('complete');

        server.inject({
          method: 'GET',
          url: '/build?buildid=3.4'
        }, function(response) {
          response.statusCode.should.equal(200);
          response.result.status.should.equal('tests queued');

          server.inject({
            method: 'GET',
            url: '/test?buildId='
          })
        });


    });
  });
  
  //lab.test('deployments can be updated when failed')
  //
  //lab.test('deployments can be updated when cancelled')
  //
  //lab.test('deployments can be updated when their environment has been recycled')

});

