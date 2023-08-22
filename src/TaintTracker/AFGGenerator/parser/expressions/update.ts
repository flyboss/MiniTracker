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

export { parseUpdateExpression };

const parseUpdateExpression: ExpressionParser = function (
  updateExpression: ESTree.UpdateExpression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): FlowNode {
  /**
   * This function parses update expressions,
   * such as ++a and a++
   * We follow the idea of parsing unary expressions.
   */

  // parse argument and replace current expr
  let argumentExprLabel = stringify(updateExpression.argument);
  currentNode = parseExpression(
    updateExpression.argument,
    currentNode,
    context,
    idLookUpTable
  );
  if (idLookUpTable.lookup(argumentExprLabel) !== '') {
    updateExpression.argument = createIdentifier(
      idLookUpTable.lookup(argumentExprLabel)
    );
  }

  // store current expr and create tempVar assignment
  let currentExprLabel = stringify(updateExpression);
  idLookUpTable.store(currentExprLabel);
  let tempVarAssignmentExpr = createAssignmentExpression({
    left: createIdentifier(idLookUpTable.lookup(currentExprLabel)),
    right: updateExpression,
  });

  return context
    .createNode()
    .appendTo(
      currentNode,
      stringify(tempVarAssignmentExpr),
      tempVarAssignmentExpr,
      updateExpression.loc
    );
};
