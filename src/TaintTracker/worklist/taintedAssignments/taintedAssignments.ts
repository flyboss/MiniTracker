import * as ESTree from '../../AFGGenerator/estree';
import * as Styx from '../../AFGGenerator/generator';
import { binaryOrLogicalHandler } from './handlers/binOpHandler';
import { identifierHandler } from './handlers/identifierHandler';
import { callHandler } from './handlers/callHandler';
import { memberHandler } from './handlers/memberHandler';
import { Taint, TaintedAssignment } from '../../interfaces/taint';
import { Helper } from '../helper';
import { AliasMap } from '../../functionAliasSearch/functionAliasMap';
import { arrayExprHandler } from './handlers/arrayHandler';
import { logger } from '../../../utils/logHelper';
import { findTaintAssignment } from '../intraProcedural';
import { BasicJs } from '../../../utils/interface/miniProgram';
import { thisHandler } from './handlers/thisHandler';

const handlers: Map<ESTree.NodeType, Function> = new Map<
  ESTree.NodeType,
  Function
>([
  // for a binary or logical expr, we mark all its operands as tainted
  [ESTree.NodeType.BinaryExpression, binaryOrLogicalHandler],
  [ESTree.NodeType.LogicalExpression, binaryOrLogicalHandler],
  // for an identifier, we mark it as tainted
  [ESTree.NodeType.Identifier, identifierHandler],
  [ESTree.NodeType.ArrayExpression, arrayExprHandler],
  [ESTree.NodeType.CallExpression, callHandler],
  [ESTree.NodeType.MemberExpression, memberHandler],
  [ESTree.NodeType.ThisExpression, thisHandler],
]);

export function runWorklist(helper: Helper, basicJs: BasicJs) {
  logger.info('Running Worklist.');
  while (helper.worklist.length) {
    const taint = helper.worklist.shift();
    if (helper.done.has(taint.uniqueName)) {
      helper.mergeTaint(taint);
      continue;
    }
    helper.done.set(taint.uniqueName, taint);
    // run bfs to find the nearest assignment to the tainted Id
    const taintedAssignments = findTaintAssignment(taint, basicJs);

    for (const taintedAssignment of taintedAssignments) {
      // Assert: all tainted edges are assignments
      handleTaintedAssignment(
        basicJs.cfg,
        taint,
        taintedAssignment,
        helper,
        basicJs.funcAliasMap
      );
    }
  }
}

export function handleTaintedAssignment(
  cfg: Styx.FlowProgram,
  taint: Taint,
  taintedAssignment: TaintedAssignment,
  helper: Helper,
  funcAliasMap: AliasMap
) {
  const assignmentExpr = taintedAssignment.edge
    .data as ESTree.AssignmentExpression;
  const handler = handlers.get(assignmentExpr.right.type);

  if (!handler) {
    logger.trace(
      `assignmentExpr type is ${assignmentExpr.right.type}, which is a sanitizer`
    );
  } else {
    handler(
      assignmentExpr.right,
      taintedAssignment,
      taint,
      helper,
      cfg,
      funcAliasMap
    );
  }
}
