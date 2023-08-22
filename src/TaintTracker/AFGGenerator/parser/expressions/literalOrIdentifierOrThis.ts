import * as ESTree from '../../estree';
import { FlowNode, ParsingContext } from '../../flow';
import { IdRecorder } from '../../util/idGenerator';
import { ExpressionParser } from './interface';

export { parseLiteralOrIdentifierOrThisExpression };

const parseLiteralOrIdentifierOrThisExpression: ExpressionParser = function (
  sequenceExpression: ESTree.SequenceExpression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): FlowNode {
  return currentNode;
};
