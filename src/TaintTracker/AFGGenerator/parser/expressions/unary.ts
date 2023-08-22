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

export { parseUnaryExpression };

const parseUnaryExpression: ExpressionParser = function (
  unaryExpression: ESTree.UnaryExpression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): FlowNode {
  /**
   * This function parses unary expressions,
   * such as !a or -a
   * We follow the way that an binary expression is parsed
   * -(-a);
   * temp1 = -a;
   * temp2 = -temp1;
   */
  // parse argument
  currentNode = parseExpression(
    unaryExpression.argument,
    currentNode,
    context,
    idLookUpTable
  );
  let argumentExprLabel = stringify(unaryExpression.argument);
  if (idLookUpTable.lookup(argumentExprLabel) !== '') {
    unaryExpression.argument = createIdentifier(
      idLookUpTable.lookup(argumentExprLabel)
    );
  }

  // store current expr and create tempVar assignment
  let currentExprLabel = stringify(unaryExpression);
  idLookUpTable.store(currentExprLabel);
  let tempVarAssignmentExpr = createAssignmentExpression({
    left: createIdentifier(idLookUpTable.lookup(currentExprLabel)),
    right: unaryExpression,
  });

  return context
    .createNode()
    .appendTo(
      currentNode,
      stringify(tempVarAssignmentExpr),
      tempVarAssignmentExpr,
      unaryExpression.loc
    );
};
