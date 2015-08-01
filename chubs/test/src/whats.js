import React from 'react';
import _ from 'lodash';

var a = 10;

var b = function() {
  return a;
};

function c(d) {
  return d + a;
}

module.exports = {
  a: a,
  b: b,
  c: c
};

_.range(10).forEach(function(i) { console.log(i) });