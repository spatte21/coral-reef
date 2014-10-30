var Lab = require('lab');
var lab = exports.lab = Lab.script();
var moment = require('moment');
var dbConfig = require('../db');

var fixtures = require('pow-mongodb-fixtures').connect(dbConfig.db, {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.username,
  pass: dbConfig.password
});

var chai = require('chai');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-datetime'));

var server;

lab.experiment('When a TeamCity build completes...', function() {

  lab.before(function(done) {
    server = require('../');

    fixtures.clear(['builds', 'deployments', 'testResults', 'testConfiguration'], function(err) {
      if (err) {
        console.log(err);
        throw err;
      }
      fixtures.load({
        testConfiguration: [
          {
            branch: 'develop',
            suites: [
              { module: 'training', submodule: 'menu-links' },
              { module: 'payroll', submodule: 'menu-links' },
              { module: 'administration', submodule: 'menu-links' },
              { module: 'payroll', submodule: 'calculations' }
            ]
          }
        ]
      }, function(err) {
        if (err) {
          console.log(err);
          throw err;
        }
        done();
      })
    })
  })

  var payload = {
    buildId: '5.1.3232',
    branch: 'develop'
  };

  lab.test('a new build is created', function(done) {
    server.inject({
      method: 'POST',
      url: '/build',
      payload: payload
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result._id.should.not.be.null;
      response.result.buildId.should.equal(payload.buildId);
      response.result.branch.should.equal(payload.branch);
      response.result.deployment.should.not.be.null;
      payload = response.result;
      done();
    });
  });

  lab.test('the new build can be retrieved using the id', function(done) {
    server.inject({
      method: 'GET',
      url: '/build/' + payload._id
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result._id.should.not.be.null;
      response.result.buildId.should.equal(payload.buildId);
      response.result.branch.should.equal(payload.branch);
      response.result.startTime.should.be.beforeTime(new Date());
      done();
    });
  });

  lab.test('the new build is present when retrieving records using the branch', function(done) {
    server.inject({
      method: 'GET',
      url: '/build/branch/' + payload.branch
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.be.at.least(1);
      response.result.should.contain.an.item.with.property('buildId', payload.buildId);
      done();
    });
  });

  lab.test('a deployment has been created', function(done) {
    server.inject({
      method: 'GET',
      url: '/deployment/' + payload.deployment._id
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.buildId.should.equal(payload.buildId);
      response.result.queued.should.be.beforeTime(new Date());
      response.result.status.should.equal('queued');
      payload = response.result;
      done();
    })
  })

  lab.test('the deployment should be in the queue', function(done) {
    server.inject({
      method: 'GET',
      url: '/deployment/queue'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.be.at.least(1);
      response.result.should.include.something.that.deep.equals(payload);
      done();
    })
  });

  lab.test('taking the next deployment off the queue results in the following deployment moving to the top', function(done) {
    // Stick a second build in the system
    server.inject({
      method: 'POST',
      url: '/build',
      payload: {
        buildId: '5.2.9760',
        branch: 'develop'
      }
    }, function(response) {
      var second_build_payload = response.result;

      server.inject({
        method: 'GET',
        url: '/deployment/queue/peek'
      }, function(response) {
        response.statusCode.should.equal(200);
        response.result.should.not.be.null;
        response.result.buildId.should.equal(payload.buildId);

        server.inject({
          method: 'PUT',
          url: '/deployment/queue/pop'
        }, function(response) {
          response.statusCode.should.equal(200);
          response.result.buildId.should.equal(payload.buildId);
          response.result.status.should.equal('deploying');
          payload = response.result;

          server.inject({
            method: 'GET',
            url: '/deployment/queue/peek'
          }, function(response) {
            response.statusCode.should.equal(200);
            response.result.buildId.should.equal(second_build_payload.buildId);
            response.result.status.should.equal('queued');
            done();
          });
        });
      });
    });
  });

  var tests = [];

  lab.test('completing a deployment should result in new tests being placed in the queue', function(done) {
    server.inject({
      method: 'POST',
      url: '/deployment/' + payload._id + '/actions',
      payload: {
        type: 'complete',
        environment: 'Diablo',
        hrUrl: 'http://deploymachine:82',
        recruitmentUrl: 'http://deploymachine',
        mobileUrl: 'http://deploymachine:84',
        snapshotName: 'Test Data 001',
        snapshotFile: 'test_data_001.bak'
      }
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.status.should.equal('complete');

      server.inject({
        method: 'GET',
        url: '/test/queue'
      }, function(response) {
        response.statusCode.should.equal(200);
        response.result.should.be.a('array');
        response.result.length.should.equal(4);
        tests = response.result;
        done();
      });
    })
  });

  lab.test('taking the next test off the queue results in the following test moving to the top', function(done) {
    server.inject({
      method: 'GET',
      url: '/test/queue/peek'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.not.be.null;
      response.result.status.should.equal('queued');
      response.result._id.id.should.equal(tests[0]._id.id);

      server.inject({
        method: 'PUT',
        url: '/test/queue/pop'
      }, function(response) {
        response.statusCode.should.equal(200);
        response.result.should.not.be.null;
        response.result.status.should.equal('testing');
        response.result._id.id.should.equal(tests[0]._id.id);
        payload = response.result;

        server.inject({
          method: 'GET',
          url: '/test/queue/peek'
        }, function(response) {
          response.statusCode.should.equal(200);
          response.result.should.not.be.null;
          response.result.status.should.equal('queued');
          response.result._id.id.should.equal(tests[1]._id.id);
          done();
        });
      });
    });
  });

  lab.test('a test can be retrieved using its id', function(done) {
    server.inject({
      method: 'GET',
      url: '/test/' + tests[0]._id
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result._id.id.should.equal(tests[0]._id.id);
      response.result.module.should.equal(tests[0].module);
      response.result.submodule.should.equal(tests[0].submodule);
      response.result.buildId.should.equal(tests[0].buildId);
      done();
    });
  });

  lab.test('a test can be completed and its results stored', function(done) {
    server.inject({
      method: 'POST',
      url: '/test/' + payload._id + '/actions',
      payload: {
        type: 'complete',
        results: {
          tests: 24,
          passes: 23,
          fails: 1,
          skipped: 0
        }
      }
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.status.should.equal('complete');
      response.result.completed.should.be.afterTime(response.result.queued);
      payload = response.result;
      done();
    });
  })

  lab.test('test and deployment information is visible against the build', function(done) {
    server.inject({
      method: 'GET',
      url: '/build?buildId=' + payload.buildId
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.deployments.should.be.a('array');
      response.result.deployments.length.should.equal(1);
      response.result.tests.should.be.a('array');
      response.result.tests.length.should.equal(4);
      done();
    });
  });

});
