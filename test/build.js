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
      response.result.messages.should.contain.an.item.with.property('description', 'Deployment queued');
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
      response.result.messages.should.contain.an.item.with.property('description', 'There were no tests configured to be run against this branch');
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

});
