#!/usr/bin/env node

require('source-map-support').install({
  handleUncaughtExceptions: false
});

import yargs from 'yargs';
import chubs from './chubs';

const argv = yargs
  .usage('Usage: $0 <entry>')
  .demand(1)
  .help('h').alias('h', 'help')
  .strict()
  .argv;

const entry = argv._[0];

chubs({
  entry
}, (data) => {
  console.log(data);
});