import { negateTruthiness } from './negator';
import { stringify } from './stringifier';

import * as ESTree from '../../estree';
import { Completion, FlowNode, ParsingContext } from '../../flow';
import { parseExpression } from '../statements/expression';
import { IdRecorder } from '../../util/idGenerator';
import {
  createAssignmentExpression,
  createIdentifier,
} from '../../estreeFactory';
import { ExpressionParser } from './interface';

export { parseLogicalExpression };

const parseLogicalExpression: ExpressionParser = function (
  logicalExpression: ESTree.LogicalExpression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): FlowNode {
  /**
   * The implementation idea is
   * the same as parseBinaryExpression
   */
  // parse right expr and replace labels
  currentNode = parseExpression(
    logicalExpression.right,
    currentNode,
    context,
    idLookUpTable
  );
  let rightExprLabel = stringify(logicalExpression.right);
  if (idLookUpTable.lookup(rightExprLabel) !== '') {
    logicalExpression.right = createIdentifier(
      idLookUpTable.lookup(rightExprLabel)
    );
  }
  // parse left expr and replace labels
  currentNode = parseExpression(
    logicalExpression.left,
    currentNode,
    context,
    idLookUpTable
  );
  let leftExprLabel = stringify(logicalExpression.left);
  if (idLookUpTable.lookup(leftExprLabel) !== '') {
    logicalExpression.left = createIdentifier(
      idLookUpTable.lookup(leftExprLabel)
    );
  }
  // store updated expression into lookup table
  let currentExprLabel = stringify(logicalExpression);
  idLookUpTable.store(currentExprLabel);
  // create an assignment expression for current node
  let tempVarAssignmentExpr = createAssignmentExpression({
    left: createIdentifier(idLookUpTable.lookup(currentExprLabel)),
    right: logicalExpression,
  });

  return context
    .createNode()
    .appendTo(
      currentNode,
      stringify(tempVarAssignmentExpr),
      tempVarAssignmentExpr,
      logicalExpression.loc
    );
};
