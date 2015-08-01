import _ from 'lodash';

export default function ({ Plugin, types: t }) {
  // TODO: check if it's safe to define this externally or if it needs to be bound per-file
  let hotSwap;
  var ws = new WeakSet();
  return new Plugin('foo-bar', {
    visitor: {
      Program(node, parent, scope, path) {
        hotSwap = scope.generateUidIdentifier('hotSwap');
        const _node = t.assignmentExpression(
          '=',
          hotSwap,
          t.callExpression(
            t.callExpression(t.identifier('require'), [t.literal('hot-swap/module')]),
            [t.literal(path.opts.filename)]
          )
        );
        this.unshiftContainer('body', t.variableDeclaration('var', [_node]));
      },
      FunctionDeclaration: {
        exit(node, parent, scope, path) {
          if (ws.has(node)) return;

          const name = node.id.name;

          const expression = t.functionExpression(node.id, node.params, node.body);

          const func = t.functionDeclaration(
            t.identifier(name),
            [],
            t.blockStatement([
              t.returnStatement(
                t.callExpression(
                  hotSwap, [t.literal('hotswap should return the proxy and it should be called here')]
                )
              )
            ])
          );

          ws.add(func);

          return [
            t.callExpression(
              hotSwap, [t.literal(name), expression]
            ),
            func
          ];
        }
      }
    }
  });
}