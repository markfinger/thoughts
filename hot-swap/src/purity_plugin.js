import _ from 'lodash';

export default function ({ Plugin, types: t }) {
  return new Plugin('foo-bar', {
    visitor: {
      Program(node, parent, scope, path) {
        //debugger
      },
      FunctionDeclaration: {
        exit(node, parent, scope, path) {
          console.log(scope.id, scope.isPure(node, true), scope.isPure(node.body, true), t.isPure(node), t.isPure(node.body));
        }
      }
    }
  });
}