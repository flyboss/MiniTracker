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

export { parseArrayExpression };

const parseArrayExpression: ExpressionParser = function (
  arrayExpression: ESTree.ArrayExpression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): FlowNode {
  // parse elements
  for (let i = 0; i < arrayExpression.elements.length; ++i) {
    let element = arrayExpression.elements[i];
    if (element === undefined || element === null) {
      arrayExpression.elements[i] = element = createIdentifier(
        '<EMPTY_PLACEHOLDER>'
      );
    }
    currentNode = parseExpression(element, currentNode, context, idLookUpTable);
    let elementExprLabel = stringify(element);
    let currentTempVar = idLookUpTable.lookup(elementExprLabel);
    if (currentTempVar !== '') {
      arrayExpression.elements[i] = createIdentifier(currentTempVar);
    }
  }
  // create temp var assignment
  let arrayExprLabel = stringify(arrayExpression);
  idLookUpTable.store(arrayExprLabel);
  let tempVarAssignmentExpr = createAssignmentExpression({
    left: createIdentifier(idLookUpTable.lookup(arrayExprLabel)),
    right: arrayExpression,
  });

  return context
    .createNode()
    .appendTo(
      currentNode,
      stringify(tempVarAssignmentExpr),
      tempVarAssignmentExpr,
      arrayExpression.loc
    );
};
