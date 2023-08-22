import { negateTruthiness } from './negator';
import { stringify } from './stringifier';

import * as ESTree from '../../estree';
import { FlowNode, ParsingContext } from '../../flow';
import { parseExpression } from '../statements/expression';
import { IdRecorder } from '../../util/idGenerator';
import {
  createAssignmentExpression,
  createIdentifier,
} from '../../estreeFactory';
import { ExpressionParser } from './interface';
import { getIdentifier } from '../../util/identifierCreator';

export { parseConditionalExpression };

const parseConditionalExpression: ExpressionParser = function (
  conditionalExpression: ESTree.ConditionalExpression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): FlowNode {
  const currentExprLabel = stringify(conditionalExpression);
  idLookUpTable.store(currentExprLabel);

  currentNode = parseExpression(
    conditionalExpression.test,
    currentNode,
    context,
    idLookUpTable
  );

  conditionalExpression.test = getIdentifier(
    conditionalExpression.test,
    idLookUpTable
  );

  const finalNode = context.createNode();
  // Then branch
  parseConsequentOrAlternate(true);
  // Else branch
  parseConsequentOrAlternate(false);

  idLookUpTable.overwrite(currentExprLabel, stringify(conditionalExpression));
  return finalNode;

  function parseConsequentOrAlternate(isConsequent: boolean) {
    const testExpr = isConsequent
      ? conditionalExpression.test
      : negateTruthiness(conditionalExpression.test);
    const testLabel = stringify(testExpr);
    const testNode = context
      .createNode()
      .appendConditionallyTo(currentNode, testLabel, testExpr);
    const branchExpr = isConsequent
      ? conditionalExpression.consequent
      : conditionalExpression.alternate;
    const branchNode = parseExpression(
      branchExpr,
      testNode,
      context,
      idLookUpTable
    );

    const branchAssignExpr = createAssignmentExpression({
      left: createIdentifier(idLookUpTable.lookup(currentExprLabel)),
      right: getIdentifier(branchExpr, idLookUpTable),
    });
    const branchAssignNode = context
      .createNode()
      .appendTo(branchNode, stringify(branchAssignExpr), branchAssignExpr, conditionalExpression.loc);

    finalNode.appendEpsilonEdgeTo(branchAssignNode);

    isConsequent
      ? (conditionalExpression.consequent = branchExpr)
      : (conditionalExpression.alternate = branchExpr);
  }
};
