'use strict';

var cucumber = require('./cucumber');
var mocha = require('./mocha');
var rspec = require('./rspec');

function Parser(){};
Parser.prototype =(function() {

  return {
    parse: function parse(results) {

      var parsedResults = {};

      if (!!results.stats) {
        parsedResults = mocha.parse(results);
      }
      else if (!!results.summary) {
        parsedResults = rspec.parse(results);
      }
      else if (!!results.tests && !!results.tests[0].keyword) {
        parsedResults = cucumber.parse(results);
      }

      return parsedResults;
    }
  };

})();

var parser = new Parser();
module.exports = parser;
