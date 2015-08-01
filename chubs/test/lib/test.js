'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _foo = require('./foo');

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
var hello = 'hello';
(0, _foo2['default'])();
//# sourceMappingURL=test.js.map