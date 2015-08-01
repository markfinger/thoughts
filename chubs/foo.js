{ '1': 
   { id: '1',
     filename: '/Users/markfinger/Projects/thoughts/chubs/test/test.js',
     dependencies: {},
     dependents: {},
     code: '\'use strict\';\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \'default\': obj }; }\n\nvar _foo = require(\'2\');\n\nvar _foo2 = _interopRequireDefault(_foo);\n\nvar a = 10;\n\nvar b = function b() {\n  return a;\n};\n\nfunction c(d) {\n  return d + a;\n}\n\nmodule.exports = {\n  a: a,\n  b: b,\n  c: c\n};\n\n(0, _foo2[\'default\'])();' },
  '2': 
   { id: '2',
     filename: '/Users/markfinger/Projects/thoughts/chubs/test/foo.js',
     dependencies: {},
     dependents: {},
     code: '\'use strict\';\n\nObject.defineProperty(exports, \'__esModule\', {\n  value: true\n});\nfunction foo() {\n  console.log(\'foo\');\n}\n\nexports[\'default\'] = foo;\nmodule.exports = exports[\'default\'];' } }

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
// /Users/markfinger/Projects/thoughts/chubs/test/test.js
// ------------------------------------------------------


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


// ------------------------------------------------------
});


__define('2', function(module, exports, require) {
// /Users/markfinger/Projects/thoughts/chubs/test/foo.js
// -----------------------------------------------------


'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
function foo() {
  console.log('foo');
}

exports['default'] = foo;
module.exports = exports['default'];


// -----------------------------------------------------
});


__require('1');

})();
  
