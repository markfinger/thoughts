import _ from 'lodash';

export default function ({ Plugin, types: t }) {
  return new Plugin('foo-bar', {
    visitor: {
      Program(node, parent, scope) {
        const id = scope.generateUidIdentifier('hotSwap');
        const _node = t.assignmentExpression("=", id, t.objectExpression({}));
        this.unshiftContainer('body', t.variableDeclaration('var', [_node]));
      }
    }
  });
}