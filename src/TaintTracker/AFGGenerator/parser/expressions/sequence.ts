import * as ESTree from '../../estree';
import { FlowNode, ParsingContext } from '../../flow';
import { IdRecorder } from '../../util/idGenerator';
import { stringify } from './stringifier';
import {
  createAssignmentExpression,
  createIdentifier,
} from '../../estreeFactory';
import { parseExpression } from '../statements/expression';
import { ExpressionParser } from './interface';

export { parseSequenceExpression };

const parseSequenceExpression: ExpressionParser = function (
  sequenceExpression: ESTree.SequenceExpression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): FlowNode {
  for (let i = 0; i < sequenceExpression.expressions.length; ++i) {
    let expression = sequenceExpression.expressions[i];
    currentNode = parseExpression(
      expression,
      currentNode,
      context,
      idLookUpTable
    );
    if (
      idLookUpTable.lookup(stringify(sequenceExpression.expressions[i])) !== ''
    ) {
      sequenceExpression.expressions[i] = createIdentifier(
        idLookUpTable.lookup(stringify(sequenceExpression.expressions[i]))
      );
    }
  }
  idLookUpTable.store(stringify(sequenceExpression));

  let tempVarAssignmentExpr = createAssignmentExpression({
    left: createIdentifier(idLookUpTable.lookup(stringify(sequenceExpression))),
    right:
      sequenceExpression.expressions[sequenceExpression.expressions.length - 1],
  });

  return context
    .createNode()
    .appendTo(
      currentNode,
      stringify(tempVarAssignmentExpr),
      tempVarAssignmentExpr,
      sequenceExpression.loc
    );
};
