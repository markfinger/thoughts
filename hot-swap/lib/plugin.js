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
      Program: function Program(node, parent, scope) {
        var id = scope.generateUidIdentifier('hotSwap');
        var _node = t.assignmentExpression("=", id, t.objectExpression({}));
        this.unshiftContainer('body', t.variableDeclaration('var', [_node]));
      }
    }
  });
};

module.exports = exports['default'];
//# sourceMappingURL=plugin.js.map