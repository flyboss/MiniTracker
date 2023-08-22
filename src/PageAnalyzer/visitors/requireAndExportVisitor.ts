import {
  BasicJs,
  ExportUnit,
  JsFile,
  UtilPathToNameMap,
} from '../../utils/interface/miniProgram';
import { TraverseOptions } from '@babel/traverse';
import * as types from '@babel/types';
import * as fspath from 'path';

// if single mode: create a mock utilPathToNameMap
// if all mode: use app's utilPathToNameMap
let utilPathToNameMap: UtilPathToNameMap;

export function setUtilPathToNameMap(u: UtilPathToNameMap) {
  utilPathToNameMap = u;
}

export function getRequireVisitor(basicJs: BasicJs) {
  const utilNamesWithDefaultWords = [];
  const requireVisitor: TraverseOptions<types.Node> = {
    VariableDeclaration: function (path) {
      const getUtilName = function (argument) {
        if (types.isNumericLiteral(argument)) {
          return utilPathToNameMap.getNameFromNumber(argument.value.toString());
        } else if (types.isStringLiteral(argument)) {
          return utilPathToNameMap.getNameFromString(
            fspath.resolve(
              fspath.dirname(basicJs.filepath),
              argument.value.toString()
            )
          );
        } else if (types.isCallExpression(argument)) {
          // logger.warn(argument);
          return getUtilName(argument.arguments[0]);
        } else {
          return void 0;
        }
      };

      for (const declaration of path.node.declarations) {
        if (
          types.isIdentifier(declaration.id) &&
          types.isCallExpression(declaration.init)
        ) {
          const name = declaration.id.name;
          if (
            types.isIdentifier(declaration.init.callee) &&
            declaration.init.callee.name === 'getApp'
          ) {
            // var o = getApp();
            let utilName = '__app__';
            basicJs.requireUtilNames.push('__app__');
            path.scope.rename(name, utilName);
          }
        }
      }

      if (types.isProgram(path.parentPath.node)) {
        for (const declaration of path.node.declarations) {
          if (
            types.isIdentifier(declaration.id) &&
            types.isCallExpression(declaration.init)
          ) {
            const name = declaration.id.name;
            if (
              types.isIdentifier(declaration.init.callee) &&
              declaration.init.callee.name === 'require'
            ) {
              // case1: var o = require('x');
              let utilName = getUtilName(declaration.init.arguments[0]);
              if (utilName) {
                basicJs.requireUtilNames.push(utilName);
                path.scope.rename(name, utilName);
              }
            } else if (types.isCallExpression(declaration.init.arguments[0])) {
              // case2: var o = p(require('x')) and
              // case3: var o = require('x')(require('y'))
              const callExpr = declaration.init.arguments[0];
              if (
                types.isIdentifier(callExpr.callee) &&
                callExpr.callee.name === 'require'
              ) {
                let utilName = getUtilName(callExpr.arguments[0]);
                if (utilName) {
                  basicJs.requireUtilNames.push(utilName);
                  path.scope.rename(name, utilName);
                  utilNamesWithDefaultWords.push(utilName);
                }
              }
            }
          }
        }
      }
    },
    MemberExpression: function (path) {
      // delete 'default' (The default keyword is often bring by mini program babel)
      // __lib__1.default => __lib__1
      const obj = path.node.object;
      const pro = path.node.property;
      for (const utilName of utilNamesWithDefaultWords) {
        if (
          types.isIdentifier(obj, { name: utilName }) &&
          types.isIdentifier(pro, { name: 'default' })
        ) {
          path.replaceWith(types.identifier(utilName));
        }
      }
      if (
        types.isCallExpression(obj) &&
        types.isIdentifier(obj.callee, { name: 'getApp' })
      ) {
        path.replaceWith(
          types.memberExpression(types.identifier('__app__'), pro)
        );
      }
    },
  };
  return requireVisitor;
}

export function getExportVisitor(jsFile: JsFile) {
  const exportVisitor: TraverseOptions<types.Node> = {
    ExpressionStatement: function (path) {
      const moduleExportsPattern1 = function (path) {
        const leftExpr = path.node.expression.left;
        const rightExpr = path.node.expression.right;
        if (
          types.isMemberExpression(leftExpr) &&
          types.isIdentifier(leftExpr.object) &&
          leftExpr.object.name === 'module' &&
          types.isIdentifier(leftExpr.property) &&
          leftExpr.property.name === 'exports'
        ) {
          if (types.isObjectExpression(rightExpr)) {
            for (const property of rightExpr.properties) {
              if (
                types.isObjectProperty(property) &&
                types.isIdentifier(property.key) &&
                types.isFunctionExpression(property.value)
              ) {
                jsFile.exportFunctions.push(new ExportUnit(property.key.name));
              }
            }
          }
        }
      };
      const moduleExportsPattern2 = function (path) {
        const leftExpr = path.node.expression.left;
        if (
          types.isMemberExpression(leftExpr) &&
          types.isMemberExpression(leftExpr.object) &&
          types.isIdentifier(leftExpr.object.object) &&
          leftExpr.object.object.name === 'module' &&
          types.isIdentifier(leftExpr.object.property) &&
          leftExpr.object.property.name === 'exports' &&
          types.isIdentifier(leftExpr.property)
        ) {
          jsFile.exportFunctions.push(new ExportUnit(leftExpr.property.name));
        }
      };

      if (
        types.isProgram(path.parentPath.node) &&
        types.isAssignmentExpression(path.node.expression)
      ) {
        moduleExportsPattern1(path);
        moduleExportsPattern2(path);
      }
    },
  };
  return exportVisitor;
}
