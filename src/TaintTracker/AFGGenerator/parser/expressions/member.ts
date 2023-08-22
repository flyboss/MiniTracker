import { negateTruthiness } from './negator';
import { stringify } from './stringifier';

import * as ESTree from '../../estree';
import { Completion, FlowNode, ParsingContext } from '../../flow';
import { parseExpression } from '../statements/expression';
import { IdRecorder } from '../../util/idGenerator';
import {
  createAssignmentExpression,
  createIdentifier,
  createMemberExpression,
} from '../../estreeFactory';
import { convertStringToMemberExpr } from '../../../util/stringManip';
import { ExpressionParser } from './interface';
import { getIdentifier } from '../../util/identifierCreator';

export { parseMemberExpression };

const parseMemberExpression: ExpressionParser = function (
  memberExpression: ESTree.MemberExpression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): FlowNode {
  // parse property
  currentNode = parseExpression(
    memberExpression.property,
    currentNode,
    context,
    idLookUpTable
  );
  memberExpression.property = getIdentifier(
    memberExpression.property,
    idLookUpTable
  );

  if (memberExpression.computed) {
    // identifier, member expr, or literal
    if (memberExpression.property.type === ESTree.NodeType.Literal) {
      let propertyName: string;
      propertyName = (
        memberExpression.property as ESTree.Literal
      ).value.toString();
      memberExpression.property = convertStringToMemberExpr(propertyName);
    }
    memberExpression = createMemberExpression(
      memberExpression.object,
      memberExpression.property
    );
    memberExpression.computed = true;
  }

  // parse object and replace current label
  let currentObjExpr = memberExpression.object;
  let currentPropExpr = memberExpression.property;
  while (currentObjExpr.type === ESTree.NodeType.MemberExpression) {
    currentPropExpr = createMemberExpression(
      (currentObjExpr as ESTree.MemberExpression).property,
      currentPropExpr
    );
    currentObjExpr = (currentObjExpr as ESTree.MemberExpression).object;
  }
  currentNode = parseExpression(
    currentObjExpr,
    currentNode,
    context,
    idLookUpTable
  );

  currentObjExpr = getIdentifier(currentObjExpr, idLookUpTable);
  memberExpression.object = currentObjExpr;
  memberExpression.property = currentPropExpr;
  let currentExprLabel = stringify(memberExpression);
  idLookUpTable.store(currentExprLabel);
  let tempVarAssignmentExpr = createAssignmentExpression({
    left: createIdentifier(idLookUpTable.lookup(currentExprLabel)),
    right: memberExpression,
  });

  return context
    .createNode()
    .appendTo(
      currentNode,
      stringify(tempVarAssignmentExpr),
      tempVarAssignmentExpr,
      memberExpression.loc
    );
};
