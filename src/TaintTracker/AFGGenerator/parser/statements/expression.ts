import { stringify } from '../expressions/stringifier';

import * as ESTree from '../../estree';
import { Completion, FlowNode, ParsingContext } from '../../flow';
import { parseAssignmentExpression } from '../expressions/assignment';
import { parseBinaryExpression } from '../expressions/binary';
import { parseCallExpression } from '../expressions/call';
import { parseConditionalExpression } from '../expressions/conditional';
import { parseLogicalExpression } from '../expressions/logical';
import { parseMemberExpression } from '../expressions/member';
import { parseObjectExpression } from '../expressions/object';
import { parseUnaryExpression } from '../expressions/unary';
import { parseUpdateExpression } from '../expressions/update';
import { IdRecorder } from '../../util/idGenerator';
import { parseObjectExpressionExperimental } from '../expressions/experimentalObjectParser';
import { parseArrayExpression } from '../expressions/array';
import { parseSequenceExpression } from '../expressions/sequence';
import { ExpressionParser } from '../expressions/interface';
import { parseLiteralOrIdentifierOrThisExpression } from '../expressions/literalOrIdentifierOrThis';
import { parseNewExpression } from '../expressions/new';

export { parseExpression, parseExpressionStatement };

function parseExpressionStatement(
  expressionStatement: ESTree.ExpressionStatement,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): Completion {
  return {
    normal: parseExpression(
      expressionStatement.expression,
      currentNode,
      context,
      idLookUpTable
    ),
  };
}

const expressionParser: Map<ESTree.NodeType, Function> = new Map<
  ESTree.NodeType,
  ExpressionParser
>([
  [ESTree.NodeType.SequenceExpression, parseSequenceExpression],
  [ESTree.NodeType.AssignmentExpression, parseAssignmentExpression],
  [ESTree.NodeType.BinaryExpression, parseBinaryExpression],

  [ESTree.NodeType.CallExpression, parseCallExpression],
  [ESTree.NodeType.NewExpression, parseNewExpression],

  [ESTree.NodeType.ConditionalExpression, parseConditionalExpression],
  [ESTree.NodeType.LogicalExpression, parseLogicalExpression],
  [ESTree.NodeType.MemberExpression, parseMemberExpression],
  [ESTree.NodeType.ObjectExpression, parseObjectExpressionExperimental],
  [ESTree.NodeType.ArrayExpression, parseArrayExpression],
  [ESTree.NodeType.UnaryExpression, parseUnaryExpression],
  [ESTree.NodeType.UpdateExpression, parseUpdateExpression],

  [ESTree.NodeType.Literal, parseLiteralOrIdentifierOrThisExpression],
  [ESTree.NodeType.Identifier, parseLiteralOrIdentifierOrThisExpression],
  [ESTree.NodeType.ThisExpression, parseLiteralOrIdentifierOrThisExpression],
]);

function parseExpression(
  expression: ESTree.Expression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): FlowNode {
  const parser = expressionParser.get(expression.type);
  if (parser !== undefined) {
    return parser(expression, currentNode, context, idLookUpTable);
  } else {
    return context
      .createNode()
      .appendTo(currentNode, stringify(expression), expression, expression.loc);
  }
}
