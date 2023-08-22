/**
 * deal input handler
 */

import { NodePath, TraverseOptions } from '@babel/traverse';
import * as types from '@babel/types';
import { HtmlFileInfo } from '../htmlParser/fileInfo/htmlFileInfo';
import { logger } from '../../utils/logHelper';
import { getInputCallExpression } from './util';

function getReplaceThisExprVisitor(): TraverseOptions<types.Node> {
  return {
    AssignmentExpression: function (path) {
      if (types.isThisExpression(path.node.right)) {
        path.replaceWith(
          types.assignmentExpression(
            '=',
            path.node.left,
            getInputCallExpression()
          )
        );
      }
    },
  };
}

function getInsertParaToHandlerVisitor(
  htmlFileInfo: HtmlFileInfo
): TraverseOptions<types.Node> {
  return {
    FunctionExpression: function (path) {
      const argumentName = (path.node.params[0] as types.Identifier)?.name;
      if (argumentName === undefined) {
        logger.warn(
          '[Transpiler] Handler does not have arguments, searching for `this` expression instead.'
        );
        path.traverse(getReplaceThisExprVisitor());
      } else {
        path
          .get('body')
          .unshiftContainer(
            'body',
            types.expressionStatement(
              types.assignmentExpression(
                '=',
                types.identifier(argumentName),
                getInputCallExpression()
              )
            )
          );
      }
      path.skip();
    },
  };
}

function getInputEventHandlersVisitor(
  htmlFileInfo: HtmlFileInfo
): TraverseOptions<types.Node> {
  return {
    ObjectProperty: function (path) {
      for (const inputEventHandlerName of htmlFileInfo.inputs
        .inputEventHandlers) {
        if (
          types.isIdentifier(path.node.key, { name: inputEventHandlerName }) &&
          types.isFunctionExpression(path.node.value) &&
          types.isType('ObjectExpression', path.parentPath.node.type) &&
          types.isType(
            'CallExpression',
            path.parentPath.parentPath.node.type
          ) &&
          types.isIdentifier(
            (<types.CallExpression>path.parentPath.parentPath.node).callee,
            { name: 'Page' }
          )
        ) {
          logger.debug(
            `[Transpiler] Found input event handler ${inputEventHandlerName}`
          );
          path.traverse(getInsertParaToHandlerVisitor(htmlFileInfo));
        }
      }
    },
  };
}

export function inputHandlerHelper(
  htmlFileInfo: HtmlFileInfo,
  path: NodePath
): void {
  path.traverse(getInputEventHandlersVisitor(htmlFileInfo));
}
