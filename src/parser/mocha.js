'use strict';

var _ = require('lodash');

function MochaParser(){};
MochaParser.prototype =(function() {

  return {
    parse: function parse(data) {
      var parsed = {
        type: 'mocha',
        stats: {
          tests: data.stats.tests,
          passes: data.stats.passes,
          failures: data.stats.failures,
          start: data.stats.start,
          end: data.stats.end,
          duration: data.stats.duration
        },
        tests: []
      };

      _.forEach(data.tests, function(element) {
        var test = {
          name: element.title,
          duration: element.duration,
          err: {}
        };

        if (!!element.err.message) {
          test.err = {
            message: element.err.message
          }
        }

        parsed.tests.push(test);
      });

      return parsed;
    }
  };

})();

var parser = new MochaParser();
module.exports = parser;
