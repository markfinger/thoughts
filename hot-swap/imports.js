// given exports.js

module.exports.foo = 8;

// and imports.js

var foo = require('./bar').foo;

module.exports = function() {
  return foo;
};

// imports.js should be changed to

var _bar = require('./bar');
var bar = {};

Object.defineProperty(bar, 'foo', {
  get: function() {
    return _bar.foo;
  }
});

module.exports = function() {
  return bar.foo;
};
