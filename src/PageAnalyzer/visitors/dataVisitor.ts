/**
 * deal two-way data bind
 */

import { NodePath, TraverseOptions } from '@babel/traverse';
import * as types from '@babel/types';
import { HtmlFileInfo } from '../htmlParser/fileInfo/htmlFileInfo';
import { getInputCallExpression } from './util';
import { logger } from '../../utils/logHelper';

function getReplaceInputDataToCallVisitor(
  htmlFileInfo: HtmlFileInfo
): TraverseOptions<types.Node> {
  return {
    ObjectProperty: function (path) {
      for (const identifierName of htmlFileInfo.inputs.userInputs) {
        if (
          types.isIdentifier(path.node.key, { name: identifierName }) &&
          types.isStringLiteral(path.node.value, { value: '' }) &&
          types.isType('ObjectExpression', path.parentPath.node.type) &&
          types.isType(
            'ObjectProperty',
            path.parentPath.parentPath.node.type
          ) &&
          types.isIdentifier(
            (<types.ObjectProperty>path.parentPath.parentPath.node).key,
            { name: 'data' }
          )
        ) {
          path.replaceWith(
            types.objectProperty(
              types.identifier(identifierName),
              getInputCallExpression()
            )
          );
          logger.debug(`[Transpiler] Found user input ${path.node.key.name}`);
        }
      }
    },
  };
}

function getDataVisitor(
  htmlFileInfo: HtmlFileInfo
): TraverseOptions<types.Node> {
  return {
    ObjectProperty: function (path) {
      if (
        types.isIdentifier(path.node.key, { name: 'data' }) &&
        types.isType('ObjectExpression', path.parentPath.node.type) &&
        types.isType('CallExpression', path.parentPath.parentPath.node.type) &&
        types.isIdentifier(
          (<types.CallExpression>path.parentPath.parentPath.node).callee,
          { name: 'Page' }
        )
      ) {
        logger.debug('Found data definition');
        path.traverse(getReplaceInputDataToCallVisitor(htmlFileInfo));
      }
    },
  };
}

export function dataHelper(htmlFileInfo: HtmlFileInfo, path: NodePath): void {
  path.traverse(getDataVisitor(htmlFileInfo));
}
