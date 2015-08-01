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

  // TODO: check if it's safe to define this externally or if it needs to be bound per-file
  var hotSwap = undefined;
  var ws = new WeakSet();
  return new Plugin('foo-bar', {
    visitor: {
      Program: function Program(node, parent, scope, path) {
        hotSwap = scope.generateUidIdentifier('hotSwap');
        var _node = t.assignmentExpression('=', hotSwap, t.callExpression(t.callExpression(t.identifier('require'), [t.literal('hot-swap/module')]), [t.literal(path.opts.filename)]));
        this.unshiftContainer('body', t.variableDeclaration('var', [_node]));
      },
      FunctionDeclaration: {
        exit: function exit(node, parent, scope, path) {
          if (ws.has(node)) return;

          var name = node.id.name;

          var expression = t.functionExpression(node.id, node.params, node.body);

          var func = t.functionDeclaration(t.identifier(name), [], t.blockStatement([t.returnStatement(t.callExpression(hotSwap, [t.literal('hotswap should return the proxy and it should be called here')]))]));

          ws.add(func);

          return [t.callExpression(hotSwap, [t.literal(name), expression]), func];
        }
      }
    }
  });
};

module.exports = exports['default'];
//# sourceMappingURL=plugin.js.map