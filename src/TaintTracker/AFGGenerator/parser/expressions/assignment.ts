import { negateTruthiness } from "./negator";
import { stringify } from "./stringifier";

import * as ESTree from "../../estree";
import { Completion, FlowNode, ParsingContext } from "../../flow";
import { parseExpression } from "../statements/expression";
import { IdRecorder } from "../../util/idGenerator";
import { createAssignmentExpression, createIdentifier } from "../../estreeFactory";
import {ExpressionParser} from "./interface";

export { parseAssignmentExpression };

const parseAssignmentExpression: ExpressionParser =function (
    assignmentExpression: ESTree.AssignmentExpression,
    currentNode: FlowNode,
    context: ParsingContext,
    idLookUpTable: IdRecorder
): FlowNode {
  /**
   * The basic idea:
   * We re-write assignments into 3-address code,
   * where at most one address is written.
   *
   * Current Effect:
   * // given
   * a = b = 1 + 2;
   * // we output
   * temp1 = 1 + 2;
   * temp2 = temp1;
   * b = temp2;
   * a = temp2;
   *
   * Implementation:
   * For each assignment expression, we search its .right member
   * to find the first assignment on the most right-hand side.
   * To support multiple nested assignments, we do the following:
   *   1. The first assignment is assigned to a tempVar
   *   then the tempVar is assigned to the left-value
   *   2. The tempVar uses the entire first assignment expr as its key
   *   3. Other assignments also use the same tempVar as their right-value
   *
   * Note: The left-value is currently not post-processed into a temp var.
   */

  // parse RHS
  currentNode = parseExpression(
      assignmentExpression.right,
      currentNode,
      context,
      idLookUpTable
  );
  // console.log(stringify(assignmentExpression.right));
  // parse LHS
  // TODO: How are we supposed to deal with the left-values?
  currentNode = parseExpression(
      assignmentExpression.left,
      currentNode,
      context,
      idLookUpTable
  );

  // search for the first assignment expr
  let currentExpr = assignmentExpression;
  while (currentExpr.right.type === ESTree.NodeType.AssignmentExpression) {
    currentExpr = <ESTree.AssignmentExpression>currentExpr.right;
  }

  const currentExprLabel:string = stringify(currentExpr);
  if (currentExpr === assignmentExpression) {
    // currentExpr is the right-most assignment expr
    // so we create a temp var assignment
    // and store current expression into lookup table
    idLookUpTable.store(currentExprLabel);
    // assign right-value to a temp var
    let rhs = idLookUpTable.lookup(stringify(currentExpr.right))
    if (rhs === ""){
      rhs = stringify(currentExpr.right);
    }
    let tempVarAssignmentExpr = createAssignmentExpression({
      left: createIdentifier(idLookUpTable.lookup(currentExprLabel)),
      right: createIdentifier(rhs)
    });
    // create node for the extra assignment
    currentNode = context
        .createNode()
        .appendTo(currentNode, stringify(tempVarAssignmentExpr), tempVarAssignmentExpr,assignmentExpression.loc);
  }

  const modifiedAssignmentExpr: ESTree.AssignmentExpression = createAssignmentExpression({
    left: assignmentExpression.left,
    right: createIdentifier(idLookUpTable.lookup(currentExprLabel))
  });

  return context
      .createNode()
      .appendTo(
          currentNode,
          stringify(modifiedAssignmentExpr),
          modifiedAssignmentExpr,
          assignmentExpression.loc
      );
}
