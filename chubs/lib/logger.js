'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var namespace = 'chubs';

function log(name) {
  return (0, _debug2['default'])(namespace + ':' + name);
}

exports['default'] = log;
module.exports = exports['default'];
//# sourceMappingURL=logger.js.map