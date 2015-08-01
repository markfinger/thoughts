#!/usr/bin/env node
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _chubs = require('./chubs');

var _chubs2 = _interopRequireDefault(_chubs);

require('source-map-support').install({
  handleUncaughtExceptions: false
});

var argv = _yargs2['default'].usage('Usage: $0 <entry>').demand(1).help('h').alias('h', 'help').strict().argv;

var entry = argv._[0];

(0, _chubs2['default'])({
  entry: entry
}, function (data) {
  console.log(data);
});
//# sourceMappingURL=bin.js.map