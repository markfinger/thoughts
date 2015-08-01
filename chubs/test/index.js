#!/usr/bin/env node

require('source-map-support').install({
  handleUncaughtExceptions: false
});

var path = require('path');
var chubs = require('../lib/chubs');

var file = path.join(__dirname, 'test.js');

var data = chubs(file);