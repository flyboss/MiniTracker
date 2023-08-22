import * as types from '@babel/types';
import traverse, { TraverseOptions, Visitor } from '@babel/traverse';
import { isIdentifier } from '../../TaintTracker/AFGGenerator/estree';
import { parse } from '@babel/parser';
import generate from '@babel/generator';
import { logger } from '../../utils/logHelper';
import {BlockStatement} from "@babel/types";

const findPromiseVisitor: TraverseOptions<types.Node> = {
  NewExpression: function (path) {
    if (isIdentifier(path.node.callee, { name: 'Promise' })) {
      const func = path.node.arguments[0];
      if (types.isFunctionExpression(func)) {
        let resloveName, rejectName;
        if (types.isIdentifier(func.params[0])) {
          resloveName = func.params[0].name;
        }
        if (types.isIdentifier(func.params[1])) {
          rejectName = func.params[1].name;
        }
        if (resloveName === undefined && rejectName === undefined) {
          path.skip();
        }
        path.traverse(addReturnVisitor, { resloveName, rejectName });
      }
    }
  },
};

const addReturnVisitor = {
  CallExpression: function (path) {
    if (
      (this.resloveName !== undefined &&
        this.resloveName === path.node.callee.name) ||
      (this.rejectName !== undefined &&
        this.rejectName === path.node.callee.name)
    ) {
      if (path.node.arguments.length === 0) {
        path.skip();
      }
      const arg = path.node.arguments[0];
      let currentPath = path;
      let parentPath = currentPath.parentPath;
      while (parentPath){
        if (types.isReturnStatement(parentPath.node)){
          break;
        }else if (types.isExpressionStatement(parentPath.node)){
          currentPath.insertAfter(types.returnStatement(arg))
          break;
        } else if (types.isFunctionExpression(parentPath.node)){
          break;
        }
        currentPath = parentPath;
        parentPath = parentPath.parentPath;
      }
      path.skip();

      // }
      // try {
      //   if (types.isReturnStatement(path.parentPath.node)) {
      //     path.parentPath.insertAfter(types.returnStatement(arg));
      //     path.parentPath.remove();
      //   } else if (
      //     types.isSequenceExpression(path.parentPath.node) ||
      //     types.isLogicalExpression(path.parentPath.node) ||
      //     types.isConditionalExpression(path.parentPath.node) ||
      //     types.isUnaryLike(path.parentPath.node)
      //   ) {
      //     // path.parentPath.parentPath.parentPath.push(types.returnStatement(arg))
      //     // path.parentPath.insertAfter(types.returnStatement(arg));
      //     // path.parentPath.remove();
      //   } else {
      //     path.insertAfter(types.returnStatement(arg));
      //     // path.remove();
      //     // path.replaceWith(types.returnStatement(temp)); => it will create a IIFT return
      //   }
      // } catch (e) {
      //   logger.warn('cannot deal promise return');
      // }
    }
  },
};

export function getPromiseVisitor() {
  return findPromiseVisitor;
}

if (require.main === module) {
  const js = `
new Promise(function (resolve, reject) {
  let a = 1;
  switch (a) {
    case 1:resolve(1);break;
    case 2:return resolve(1);break;
    case 3:3+1 && resolve(1);break;
    case 4: a=1,resolve(1);break;
    case 5: a>1?a=1:resolve(1);break;
    case 6: resolve(xx.xx);break;
    case 7: return void resolve(1);break;
  }
  swan.requy({
    success: function(){resolve(1)}
  })
})
`;
  console.log('============== code ==============');
  console.log(js);
  const ast = parse(js);
  traverse(ast, getPromiseVisitor());
  const newJs = generate(ast, {}, js).code;
  console.log('============== new code ==============');
  console.log(newJs);
}
