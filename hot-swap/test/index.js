#!/usr/bin/env node

require('source-map-support').install({
  handleUncaughtExceptions: false
});

var path = require('path');
var babel = require('babel');

babel.transformFile(
  path.join(__dirname, 'test.js'),
  {
    plugins: ['../lib/plugin']
  },
  function(err, result) {
    if (err) throw err;

    console.log('\n---------------------\n')
    console.log(result.code);
  }
);
