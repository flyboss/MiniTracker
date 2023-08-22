import { stringify } from "../expressions/stringifier";

import * as ESTree from "../../estree";
import { createAssignmentExpression } from "../../estreeFactory";

import { Completion, FlowNode, ParsingContext } from "../../flow";
import { parseExpression } from "../statements/expression";
import { IdRecorder } from "../../util/idGenerator";

export { parseVariableDeclaration };

function parseVariableDeclaration(
  declaration: ESTree.VariableDeclaration,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): Completion {
  for (let declarator of declaration.declarations) {
    let declarationExpression = declarator.init
      ? createAssignmentExpressionFrom(declarator)
      : declarator.id;

    currentNode = parseExpression(
      declarationExpression,
      currentNode,
      context,
      idLookUpTable
    );

    /*
    currentNode = context
      .createNode()
      .appendTo(currentNode, stringify(declarationExpression), declarator);
  }*/
  }
  
  return { normal: currentNode };
}

function createAssignmentExpressionFrom(
  declarator: ESTree.VariableDeclarator
): ESTree.Expression {
  return createAssignmentExpression({
    left: declarator.id,
    right: declarator.init,
  });
}
