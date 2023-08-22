import { ExpressionParser } from './interface';
import * as ESTree from '../../estree';
import { FlowNode, ParsingContext } from '../../flow';
import { IdRecorder } from '../../util/idGenerator';
import { isIdentifier } from '../../estree';
import { parseCallExpression } from './call';
import {stringify} from "./stringifier";
import {createAssignmentExpression, createCallExpression, createIdentifier} from "../../estreeFactory";

export { parseNewExpression };

const parseNewExpression: ExpressionParser = function (
  newExpression: ESTree.NewExpression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): FlowNode {
  if (isIdentifier(newExpression.callee, { name: 'Promise' })) {
    const currentExprLabel = stringify(newExpression);
    idLookUpTable.store(currentExprLabel);
    const callExpr = createCallExpression(newExpression.arguments[0],[]);
    // Note: 这里的处理行为和一般的expression不一样，
    // currentExprLabel = new Promise($$func1)
    // callExpr = $$func1
    const tempVarAssignmentExpr = createAssignmentExpression({
      left: createIdentifier(idLookUpTable.lookup(currentExprLabel)),
      right: callExpr,
    });

    return context
        .createNode()
        .appendTo(
            currentNode,
            stringify(tempVarAssignmentExpr),
            tempVarAssignmentExpr,
            newExpression.loc
        );
  } else {
    return parseCallExpression(
      newExpression,
      currentNode,
      context,
      idLookUpTable
    );
  }
};
