import { TraverseOptions } from '@babel/traverse';
import * as types from '@babel/types';
import { ifVisitorHelper } from './ifVisitor';
import { HtmlFileInfo } from '../htmlParser/fileInfo/htmlFileInfo';
import { Page } from '../../utils/interface/miniProgram';
import { dataHelper } from './dataVisitor';
import { inputHandlerHelper } from './inputEventHandlersVisitor';
import {logger} from "../../utils/logHelper";

export function getMainVisitor(
  page: Page,
  htmlFileInfo: HtmlFileInfo
): TraverseOptions<types.Node> {
  const masterVisitor: TraverseOptions<types.Node> = {
    /**
     * 1. Locates all Page() function calls.
     * 2. Converts ArrowFunctionExpr into FunctionExpr
     *    because styx does not support ArrowFunctionExprs
     */
    CallExpression: function (path) {
      if (
        types.isIdentifier(path.node.callee, { name: 'Page' }) &&
        path.parentPath.node.type === 'ExpressionStatement' &&
        path.parentPath.parentPath.type === 'Program'
      ) {
        logger.debug('Found Page definition');

        dataHelper(htmlFileInfo, path);
        inputHandlerHelper(htmlFileInfo, path);
        ifVisitorHelper(htmlFileInfo, path, page);
      }
    },
    ArrowFunctionExpression: function (path) {
      let funcBody = types.isBlockStatement(path.node.body)
        ? path.node.body
        : types.blockStatement([types.returnStatement(path.node.body)]);
      path.replaceWith(
        types.functionExpression(null, path.node.params, funcBody)
      );
    },
  };
  return masterVisitor;
}
