'use strict';

var _ = require('lodash');

function CucumberParser(){};
CucumberParser.prototype =(function() {

  return {
    parse: function parse(data) {

      var parsed = {
          type: 'cucumber',
          stats: {
            tests: 0,
            passes: 0,
            failures: 0,
            start: null,
            end: null,
            duration: null
          },
          features: []
        };

      _.forEach(data.tests, function(element) {
        if (element.keyword === 'Feature') {
          var feature = {
            name: element.name,
            description: element.description,
            tests: []
          };

          _.forEach(element.elements, function(element) {
            if (element.keyword === 'Scenario') {
              var scenario = {
                name: element.name,
                steps: []
              };

              var testFailed = false;

              _.forEach(element.steps, function(element) {
                var step = {
                  keyword: element.keyword,
                  name: element.name,
                  result: {
                    status: element.result.status,
                    errorMessage: element.result.error_message
                  }
                };

                scenario.steps.push(step);

                if (step.result.status === 'failed') {
                  testFailed = true;
                  return false;
                }
              });

              feature.tests.push(scenario);
              parsed.stats.tests += 1;
              testFailed ?
                parsed.stats.failures += 1 :
                parsed.stats.passes += 1;
            }
          });

          parsed.features.push(feature);
        }
      });

      return parsed;
    }
  };

})();

var parser = new CucumberParser();
module.exports = parser;
