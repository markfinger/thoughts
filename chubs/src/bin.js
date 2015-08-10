#!/usr/bin/env node

import sourceMapSupport from 'source-map-support';
import yargs from 'yargs';
import chubs from './chubs';

sourceMapSupport.install({
  handleUncaughtExceptions: false
});

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