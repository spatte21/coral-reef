var Lab = require('lab');
var lab = exports.lab = Lab.script();
var constants = require('../src/config/constants');

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

lab.experiment('When testing the build route...', function() {

  lab.before(function(done) {

    server = require('../');

    fixtures.clear(['builds', 'deployments', 'testResults', 'testConfiguration', 'dataConfiguration'], function(err) {
      if (err) {
        console.log(err);
        throw err;
      }
      fixtures.load({
        builds: [
          {
            buildId: '1.2.3.4',
            branch: 'develop'
          },
          {
            _id: id('546a30f78888d194e188bdd6'),
            buildId: '5.6.7.8',
            branch: 'release'
          },
          {
            buildId: '10.12',
            branch: 'master'
          }
        ],
        testConfiguration: [
          {
            branch: 'develop',
            suites: [
              {module: 'training', suite: 'menu-links'},
              {module: 'payroll', suite: 'menu-links'},
              {module: 'payroll', suite: 'calculations'}
            ]
          },
          {
            branch: 'hr/',
            suites: [
              { module: 'administration', suite: 'menu-links' },
              { module: 'payroll', suite: 'calculations' }
            ]
          }
        ],
        dataConfiguration: [
          {
            branch: 'develop',
            snapshotName: 'develop_snapshot',
            snapshotFile: 'develop_file'
          },
          {
            branch: 'default',
            snapshotName: 'default_snapshot',
            snapshotFile: 'default_file'
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

  lab.test('a list of all the builds can be retrieved', function(done) {
    server.inject({
      method: 'GET',
      url: '/build'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.equal(3);
      done();
    });
  });

  lab.test('a specific build can be retrieved', function(done) {
    server.inject({
      method: 'GET',
      url: '/build/546a30f78888d194e188bdd6'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');
      done();
    });
  });

  lab.test('a 404 code is returned when searching for a specific build that does not exist', function(done) {
    server.inject({
      method: 'GET',
      url: '/build/abca30f78888d194e188bdd6'
    }, function(response) {
      response.statusCode.should.equal(404);
      done();
    });
  });

  lab.test('builds can be queried by buildId', function(done) {
    server.inject({
      method: 'GET',
      url: '/build?buildId=10.12'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.equal(1);
      response.result[0].buildId.should.equal('10.12');
      response.result[0].branch.should.equal('master');
      done();
    });
  });

  lab.test('builds can be queried by branch', function(done) {
    server.inject({
      method: 'GET',
      url: '/build?branch=develop'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.equal(1);
      response.result[0].branch.should.equal('develop');
      response.result[0].buildId.should.equal('1.2.3.4');
      done();
    });
  });

  lab.test('a search with no results returns an empty array', function(done) {
    server.inject({
      method: 'GET',
      url: '/build?branch=feature'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('array');
      response.result.length.should.equal(0);
      done();
    });
  });

  lab.test('a new build can be inserted and a deployment queued', function(done) {
    server.inject({
      method: 'POST',
      url: '/build',
      payload: {
        buildId: '2.4.6.8',
        branch: 'hr/hr-32'
      }
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');
      response.result.buildId.should.equal('2.4.6.8');
      response.result.branch.should.equal('hr/hr-32');
      response.result.status.should.equal('deployment queued');
      response.result.deployment.should.be.a('object');
      response.result.deployment.queued.should.be.beforeTime(new Date());
      done();
    });
  });

  lab.test('a 400 status code is returned if the payload for the new build is invalid', function(done) {
    server.inject({
      method: 'POST',
      url: '/build',
      payload: {
        buildId: '4.3.2'
        // missing branch
      }
    }, function(response) {
      response.statusCode.should.equal(400);
      response.result.validation.keys.should.contain('branch');
      done();
    })
  });

  lab.test('if no tests are configured for this branch then the build is marked as not needing testing', function(done) {
    server.inject({
      method: 'POST',
      url: '/build',
      payload: {
        buildId: '2.32.34',
        branch: 'no-tests'
      }
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.be.a('object');
      response.result.buildId.should.equal('2.32.34');
      should.not.exist(response.result.deployment);
      response.result.status.should.equal('not for testing');
      done();
    })
  });

  lab.test('a build can be deleted', function(done) {
    server.inject({
      method: 'DELETE',
      url: '/build/546a30f78888d194e188bdd6'
    }, function(response) {
      response.statusCode.should.equal(200);
      response.result.should.equal(1);

      server.inject({
        method: 'GET',
        url: '/build/546a30f78888d194e188bdd6'
      }, function(response) {
        response.statusCode.should.equal(404);
        done();
      })
    });
  });

  lab.test('a 404 code is returned when trying to delete a build that does not exist', function(done) {
    server.inject({
      method: 'DELETE',
      url: '/build/546a30f78888d194e1881111'
    }, function(response) {
      response.statusCode.should.equal(404);
      done();
    })
  });


  //lab.test('a deployment has been created', function(done) {
  //  server.inject({
  //    method: 'GET',
  //    url: '/deployment/' + payload.deployments[0]._id
  //  }, function(response) {
  //    response.statusCode.should.equal(200);
  //    response.result.buildId.should.equal(payload.buildId);
  //    response.result.queued.should.be.beforeTime(new Date());
  //    response.result.status.should.equal('queued');
  //    payload = response.result;
  //    done();
  //  })
  //})
  //
  //lab.test('the deployment should be in the queue', function(done) {
  //  server.inject({
  //    method: 'GET',
  //    url: '/deployment/queue'
  //  }, function(response) {
  //    response.statusCode.should.equal(200);
  //    response.result.should.be.a('array');
  //    response.result.length.should.be.at.least(1);
  //    response.result.should.include.something.that.deep.equals(payload);
  //    done();
  //  })
  //});
  //
  //lab.test('taking the next deployment off the queue results in the following deployment moving to the top', function(done) {
  //  // Stick a second build in the system
  //  server.inject({
  //    method: 'POST',
  //    url: '/build',
  //    payload: {
  //      buildId: '5.2.9760',
  //      branch: 'hr/hr-3231'
  //    }
  //  }, function(response) {
  //    response.statusCode.should.equal(200);
  //    response.result.deployments[0].snapshotName.should.equal('default_snapshot');
  //
  //    var second_build_payload = response.result;
  //
  //    server.inject({
  //      method: 'GET',
  //      url: '/deployment/queue/peek'
  //    }, function(response) {
  //      response.statusCode.should.equal(200);
  //      response.result.should.not.be.null;
  //      response.result.buildId.should.equal(payload.buildId);
  //
  //      server.inject({
  //        method: 'PUT',
  //        url: '/deployment/queue/pop'
  //      }, function(response) {
  //        response.statusCode.should.equal(200);
  //        response.result.buildId.should.equal(payload.buildId);
  //        response.result.status.should.equal('deploying');
  //        payload = response.result;
  //
  //        server.inject({
  //          method: 'GET',
  //          url: '/deployment/queue/peek'
  //        }, function(response) {
  //          response.statusCode.should.equal(200);
  //          response.result.buildId.should.equal(second_build_payload.buildId);
  //          response.result.status.should.equal('queued');
  //          done();
  //        });
  //      });
  //    });
  //  });
  //});
  //
  //var tests = [];
  //
  //lab.test('completing a deployment should result in new tests being placed in the queue', function(done) {
  //  server.inject({
  //    method: 'POST',
  //    url: '/deployment/' + payload._id + '/actions',
  //    payload: {
  //      type: 'complete',
  //      environment: 'Diablo',
  //      hrUrl: 'http://deploymachine:82',
  //      recruitmentUrl: 'http://deploymachine',
  //      mobileUrl: 'http://deploymachine:84',
  //      snapshotName: 'Test Data 001',
  //      snapshotFile: 'test_data_001.bak'
  //    }
  //  }, function(response) {
  //    response.statusCode.should.equal(200);
  //    response.result.status.should.equal('complete');
  //
  //    server.inject({
  //      method: 'GET',
  //      url: '/test/queue'
  //    }, function(response) {
  //      response.statusCode.should.equal(200);
  //      response.result.should.be.a('array');
  //      response.result.length.should.equal(3);
  //      tests = response.result;
  //      done();
  //    });
  //  })
  //});
  //
  //lab.test('taking the next test off the queue results in the following test moving to the top', function(done) {
  //  server.inject({
  //    method: 'GET',
  //    url: '/test/queue/peek'
  //  }, function(response) {
  //    response.statusCode.should.equal(200);
  //    response.result.should.not.be.null;
  //    response.result.status.should.equal('queued');
  //    response.result._id.id.should.equal(tests[0]._id.id);
  //
  //    server.inject({
  //      method: 'PUT',
  //      url: '/test/queue/pop'
  //    }, function(response) {
  //      response.statusCode.should.equal(200);
  //      response.result.should.not.be.null;
  //      response.result.status.should.equal('testing');
  //      response.result._id.id.should.equal(tests[0]._id.id);
  //      payload = response.result;
  //
  //      server.inject({
  //        method: 'GET',
  //        url: '/test/queue/peek'
  //      }, function(response) {
  //        response.statusCode.should.equal(200);
  //        response.result.should.not.be.null;
  //        response.result.status.should.equal('queued');
  //        response.result._id.id.should.equal(tests[1]._id.id);
  //        done();
  //      });
  //    });
  //  });
  //});
  //
  //lab.test('a test can be retrieved using its id', function(done) {
  //  server.inject({
  //    method: 'GET',
  //    url: '/test/' + tests[0]._id
  //  }, function(response) {
  //    response.statusCode.should.equal(200);
  //    response.result._id.id.should.equal(tests[0]._id.id);
  //    response.result.module.should.equal(tests[0].module);
  //    response.result.suite.should.equal(tests[0].suite);
  //    response.result.buildId.should.equal(tests[0].buildId);
  //    done();
  //  });
  //});
  //
  //lab.test('a test can be completed and its results stored', function(done) {
  //  server.inject({
  //    method: 'POST',
  //    url: '/test/' + payload._id + '/actions',
  //    payload: {
  //      type: 'complete',
  //      results: {
  //        tests: 24,
  //        passes: 23,
  //        fails: 1,
  //        skipped: 0
  //      }
  //    }
  //  }, function(response) {
  //    response.statusCode.should.equal(200);
  //    response.result.status.should.equal('complete');
  //    response.result.completed.should.be.afterTime(response.result.queued);
  //    payload = response.result;
  //    done();
  //  });
  //});
  //
  //lab.test('environmentStatus only set to available once all tests are complete for that deployment', function(done) {
  //  server.inject({
  //    method: 'GET',
  //    url: '/test/queue'
  //  }, function(response) {
  //    response.statusCode.should.equal(200);
  //    response.result.length.should.equal(2);
  //    var remainingTests = response.result;
  //
  //    server.inject({
  //      method: 'POST',
  //      url: '/test/' + remainingTests[0]._id + '/actions',
  //      payload: {
  //        type: 'complete',
  //        results: {
  //          tests: 10,
  //          passes: 10,
  //          fails: 0,
  //          skipped: 0
  //        }
  //      }
  //    }, function(response) {
  //      response.statusCode.should.equal(200);
  //
  //      server.inject({
  //        method: 'POST',
  //        url: '/test/' + remainingTests[1]._id + '/actions',
  //        payload: {
  //          type: 'complete',
  //          results: {
  //            tests: 10,
  //            passes: 10,
  //            fails: 0,
  //            skipped: 0
  //          }
  //        }
  //      }, function(response) {
  //        response.statusCode.should.equal(200);
  //
  //        server.inject({
  //          method: 'GET',
  //          url: '/deployment/' + remainingTests[0].deploymentId
  //        }, function(response) {
  //          response.statusCode.should.equal(200);
  //          response.result.environmentStatus.should.equal('finished');
  //          done();
  //        });
  //      });
  //    });
  //  });
  //});
  //
  //lab.test('deployments that are finished with their environments can be identified', function(done) {
  //  server.inject({
  //    method: 'GET',
  //    url: '/deployment?environmentStatus=finished'
  //  }, function(response) {
  //    response.statusCode.should.equal(200);
  //    response.result.length.should.equal(1);
  //    done();
  //  });
  //});
  //
  //lab.test('a deployment can be updated when its environment is returned to the pool', function(done) {
  //  server.inject({
  //    method: 'POST',
  //    url: '/deployment/' + payload.deploymentId + '/actions',
  //    payload: {
  //      type: 'environment-recycled'
  //    }
  //  }, function(response) {
  //    response.statusCode.should.equal(200);
  //
  //    server.inject({
  //      method: 'GET',
  //      url: '/deployment?environmentStatus=finished'
  //    }, function(response) {
  //      response.statusCode.should.equal(200);
  //      response.result.length.should.equal(0);
  //      done();
  //    });
  //  });
  //});
});
