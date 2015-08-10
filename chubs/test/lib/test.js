'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _foo = require('./foo');

var _foo2 = _interopRequireDefault(_foo);

var a = 10;

var host = window.document.location.host.replace(/:.*/, '');

var ws = new WebSocket('ws://' + host + ':' + window.location.port);

ws.onmessage = function (event) {
  console.log(JSON.parse(event.data));
};

var b = function b() {
  return a + 1;
};

function c(d) {
  return d + a;
}

module.exports = {
  a: a,
  b: b,
  c: c
};
var hello = 'hello wha';
(0, _foo2['default'])();
//# sourceMappingURL=test.js.map