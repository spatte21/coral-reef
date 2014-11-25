'use strict';

var _ = require('lodash');

function RSpecParser(){};
RSpecParser.prototype =(function() {

  return {
    parse: function parse(data) {
      var parsed = {
        type: 'rspec',
        stats: {
          tests: data.summary.example_count,
          passes: parseInt(data.summary.example_count) - parseInt(data.summary.failure_count),
          failures: data.summary.failure_count,
          start: null,
          end: null,
          duration: data.summary.duration
        },
        tests: []
      };

      _.forEach(data.examples, function(element) {
        var test = {
          name: element.full_description,
          status: element.status,
          err: {}
        };

        if (!!element.exception) {
          test.err = {
            message: element.exception.message
          }
        }

        parsed.tests.push(test);
      });

      return parsed;
    }
  };

})();

var parser = new RSpecParser();
module.exports = parser;
