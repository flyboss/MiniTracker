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

export { parseBinaryExpression };

const parseBinaryExpression: ExpressionParser = function (
  binaryExpression: ESTree.BinaryExpression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): FlowNode {
  /**
   * The basic idea:
   * We create a temp var for each expression,
   * and re-write the expression into 3-address code.
   * For example, a + b + c is modified into several assignments
   * temp1 = a + b;
   * temp2 = temp1 + c;
   *
   * Implementation:
   * We use a idLookUpTable that use stringified expr as keys and corresponding temp vars as values.
   * After we parsed a component (left or right) of binary expr,
   * we check if the component exists in the lookup table.
   * If a corresponding temp var exist,
   * we replace the expr with temp var,
   * and create an assignment expr to replace the original expression.
   */

  // parse right expr
  currentNode = parseExpression(
    binaryExpression.right,
    currentNode,
    context,
    idLookUpTable
  );
  let rightExprLabel = stringify(binaryExpression.right);
  // if right expr already exists, replace it with temp var
  if (idLookUpTable.lookup(rightExprLabel) !== '') {
    binaryExpression.right = createIdentifier(
      idLookUpTable.lookup(rightExprLabel)
    );
  }
  // parse left expr
  currentNode = parseExpression(
    binaryExpression.left,
    currentNode,
    context,
    idLookUpTable
  );
  let leftExprLabel = stringify(binaryExpression.left);
  // if left expr already exists, replace it with temp var
  if (idLookUpTable.lookup(leftExprLabel) !== '') {
    binaryExpression.left = createIdentifier(
      idLookUpTable.lookup(leftExprLabel)
    );
  }
  // store updated expression into lookup table
  let currentExprLabel = stringify(binaryExpression);
  idLookUpTable.store(currentExprLabel);
  // create an assignment expression for current node
  let tempVarAssignmentExpr = createAssignmentExpression({
    left: createIdentifier(idLookUpTable.lookup(currentExprLabel)),
    right: binaryExpression,
  });

  return context
    .createNode()
    .appendTo(
      currentNode,
      stringify(tempVarAssignmentExpr),
      tempVarAssignmentExpr,
      binaryExpression.loc
    );
};
