import { TraverseOptions } from '@babel/traverse';
import * as types from '@babel/types';
import { logger } from '../../utils/logHelper';

const componentVisitor: TraverseOptions<types.Node> = {
  ObjectProperty: function (path) {
    if (
      path.parentPath.isObjectExpression() &&
      path.parentPath.parentPath.isCallExpression()
    ) {
      const callExpr = path.parentPath.parentPath.node as types.CallExpression;
      if (
        types.isIdentifier(callExpr.callee, { name: 'Component' }) &&
        types.isIdentifier(path.node.key, { name: 'methods' })
      ) {
        if (types.isObjectExpression(path.node.value)) {
          for (const method of path.node.value.properties) {
            path.parentPath.pushContainer('properties', method);
          }
          path.remove();
        }
      } else if (
        types.isIdentifier(callExpr.callee, { name: 'Component' }) &&
        types.isIdentifier(path.node.key, { name: 'properties' })
      ) {
        if (types.isObjectExpression(path.node.value)) {
          for (const objProp of path.parentPath.node.properties) {
            if (
              types.isObjectProperty(objProp) &&
              types.isIdentifier(objProp.key, { name: 'data' }) &&
              types.isObjectExpression(objProp.value)
            ) {
              for (const p of path.node.value.properties) {
                objProp.value.properties.push(p);
              }
            }
          }
        }
        path.remove();
      }
    }
  },
};

export function getComponentVisitor() {
  return componentVisitor;
}
