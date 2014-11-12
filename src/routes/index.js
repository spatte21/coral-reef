var path = require('path');
var fs = require('fs');
var _ = require('lodash');

fs.readdirSync(__dirname).forEach(function(file) {
    if (file === 'index.js') return;

    var mod = {};

    mod[path.basename(file, '.js')] = require(path.join(__dirname, file));

    _.assign(module.exports, mod);
});
