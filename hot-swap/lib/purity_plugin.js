'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

exports['default'] = function (_ref) {
  var Plugin = _ref.Plugin;
  var t = _ref.types;

  return new Plugin('foo-bar', {
    visitor: {
      Program: function Program(node, parent, scope, path) {
        //debugger
      },
      FunctionDeclaration: {
        exit: function exit(node, parent, scope, path) {
          console.log(scope.id, scope.isPure(node, true), scope.isPure(node.body, true), t.isPure(node), t.isPure(node.body));
        }
      }
    }
  });
};

module.exports = exports['default'];
//# sourceMappingURL=purity_plugin.js.map