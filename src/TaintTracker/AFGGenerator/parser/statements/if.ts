import { negateTruthiness } from '../expressions/negator';
import { stringify } from '../expressions/stringifier';

import { parseStatement } from './statement';

import * as ESTree from '../../estree';
import { Completion, FlowNode, ParsingContext } from '../../flow';
import { parseExpression } from './expression';
import { IdRecorder } from '../../util/idGenerator';
import {
  createAssignmentExpression,
  createIdentifier,
} from '../../estreeFactory';
import { getIdentifier } from '../../util/identifierCreator';

export { parseIfStatement };

interface StatementTypeToParserMap {
  [type: string]: (
    statement: ESTree.Statement,
    currentNode: FlowNode,
    context: ParsingContext
  ) => Completion;
}

function parseIfStatement(
  ifStatement: ESTree.IfStatement,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): Completion {
  return ifStatement.alternate === null
    ? parseSimpleIfStatement(ifStatement, currentNode, context, idLookUpTable)
    : parseIfElseStatement(ifStatement, currentNode, context, idLookUpTable);
}

function parseSimpleIfStatement(
  ifStatement: ESTree.IfStatement,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): Completion {
  currentNode = parseExpression(
    ifStatement.test,
    currentNode,
    context,
    idLookUpTable
  );
  ifStatement.test = getIdentifier(ifStatement.test, idLookUpTable);
  const thenLabel = stringify(ifStatement.test);
  const thenNode = context
    .createNode()
    .appendConditionallyTo(currentNode, thenLabel, ifStatement.test);
  const thenBranchCompletion = parseStatement(
    ifStatement.consequent,
    thenNode,
    context
  );

  const finalNode = context.createNode();
  if (thenBranchCompletion.normal) {
    finalNode.appendEpsilonEdgeTo(thenBranchCompletion.normal);
  }

  const negatedTest = negateTruthiness(ifStatement.test);
  const elseLabel = stringify(negatedTest);
  finalNode.appendConditionallyTo(currentNode, elseLabel, negatedTest);

  return { normal: finalNode };
}

function parseIfElseStatement(
  ifStatement: ESTree.IfStatement,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): Completion {
  currentNode = parseExpression(
    ifStatement.test,
    currentNode,
    context,
    idLookUpTable
  );

  ifStatement.test = getIdentifier(ifStatement.test,idLookUpTable);

  const negatedTest = negateTruthiness(ifStatement.test);

  // Then branch
  const thenLabel = stringify(ifStatement.test);
  const thenNode = context
    .createNode()
    .appendConditionallyTo(currentNode, thenLabel, ifStatement.test);
  const thenBranchCompletion = parseStatement(
    ifStatement.consequent,
    thenNode,
    context
  );

  // Else branch
  const elseLabel = stringify(negatedTest);
  const elseNode = context
    .createNode()
    .appendConditionallyTo(currentNode, elseLabel, negatedTest);
  const elseBranchCompletion = parseStatement(
    ifStatement.alternate,
    elseNode,
    context
  );

  const finalNode = context.createNode();

  if (thenBranchCompletion.normal) {
    finalNode.appendEpsilonEdgeTo(thenBranchCompletion.normal);
  }

  if (elseBranchCompletion.normal) {
    finalNode.appendEpsilonEdgeTo(elseBranchCompletion.normal);
  }

  return { normal: finalNode };
}
