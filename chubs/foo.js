
(function() {
var __global = this;
var __modules = Object.create(null);
var __requireCache = Object.create(null);

function __require(dep) {
  if (__requireCache[dep] !== undefined) {
    return __requireCache[dep];
  }

  var module = {exports: {}};

  __requireCache[dep] = __modules[dep].call(__global, module, module.exports, __require);

  return module.exports;
};

var __define = function(id, _module) {
  __modules[id] = _module;
};


__define('1', function(module, exports, require) {
// file: /Users/markfinger/Projects/thoughts/chubs/test/test.js

'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _foo = require('2');

var _foo2 = _interopRequireDefault(_foo);

var a = 10;

var b = function b() {
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

(0, _foo2['default'])();
});


__define('2', function(module, exports, require) {
// file: /Users/markfinger/Projects/thoughts/chubs/test/foo.js

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
function foo() {
  console.log('foo');
}

exports['default'] = foo;
module.exports = exports['default'];
});


__require('1');

})();
  
