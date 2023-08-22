import traverse, { TraverseOptions } from '@babel/traverse';
import * as types from '@babel/types';
import { parse } from '@babel/parser';
import generate from '@babel/generator';
import { logger } from '../../utils/logHelper';

export function getVariableVisitor() {
  const variables = new Map<string, number>();
  const rename = function (identifier, path) {
    if (types.isIdentifier(identifier)) {
      const name = identifier.name;
      let id = variables.get(name) || 0;
      const newName = name + id++;
      path.scope.rename(identifier.name, newName);
      variables.set(name, id);
    }
  };

  const visitor: TraverseOptions<types.Node> = {
    VariableDeclaration: function (path) {
      for (const declaration of path.node.declarations) {
        rename(declaration.id, path);
      }
    },
    VariableDeclarator: function (path) {
      if (
        types.isType('BlockStatement', path.parentPath.parentPath.node.type) &&
        types.isType(
          'FunctionExpression',
          path.parentPath.parentPath.parentPath.node.type
        ) &&
        types.isType(
          'ObjectProperty',
          path.parentPath.parentPath.parentPath.parentPath.node.type
        ) &&
        types.isType(
          'ObjectExpression',
          path.parentPath.parentPath.parentPath.parentPath.parentPath.node.type
        ) &&
        types.isType(
          'CallExpression',
          path.parentPath.parentPath.parentPath.parentPath.parentPath.parentPath
            .node.type
        )
      ) {
        const callExpr = path.parentPath.parentPath.parentPath.parentPath
          .parentPath.parentPath.node as types.CallExpression;
        if (
          types.isIdentifier(callExpr.callee) &&
          types.isThisExpression(path.node.init) &&
          types.isIdentifier(path.node.id)
        ) {
          const LValName = path.node.id.name;
          if (callExpr.callee.name === 'Page') {
            logger.trace(
              `Renamed LVal of this from ${LValName} to __PageParameter__.`
            );
            path.scope.rename(LValName, '__PageParameter__');
          } else if (callExpr.callee.name === 'App') {
            logger.trace(
              `Renamed LVal of this from ${LValName} to __AppParameter__.`
            );
            path.scope.rename(LValName, '__AppParameter__');
          } else if (callExpr.callee.name === 'Component') {
            logger.trace(
              `Renamed LVal of this from ${LValName} to __ComponentParameter__.`
            );
            path.scope.rename(LValName, '__ComponentParameter__');
          }
        }
      }
    },
    FunctionDeclaration: function (path) {
      rename(path.node.id, path);
      for (const parameter of path.node.params) {
        rename(parameter, path);
      }
    },
    FunctionExpression: function (path) {
      for (const parameter of path.node.params) {
        rename(parameter, path);
      }
    },
  };
  return visitor;
}

if (require.main === module) {
  const js = ` 
var a = 1;
function scope1(){
  a = a + 1;
  function scope2(a,b){
    a =3;
    b++;
  }
}`;
  console.log('============== code ==============');
  console.log(js);
  const ast = parse(js);
  traverse(ast, getVariableVisitor());
  const newJs = generate(ast, {}, js).code;
  console.log('============== new code ==============');
  console.log(newJs);
}
