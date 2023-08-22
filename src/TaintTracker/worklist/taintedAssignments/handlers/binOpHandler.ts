import * as ESTree from '../../../AFGGenerator/estree';
import { copyPropertyStack } from '../../../util/utils';
import { Helper } from '../../helper';
import {
  Taint,
  TaintedAssignment,
  TaintFlow,
  TaintType,
} from '../../../interfaces/taint';
import * as Styx from '../../../AFGGenerator/generator';
import { AliasMap } from '../../../functionAliasSearch/functionAliasMap';

export function binaryOrLogicalHandler(
  expr: ESTree.BinaryExpression | ESTree.LogicalExpression,
  taintedAssignment: TaintedAssignment,
  taint: Taint,
  helper: Helper,
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  // Assert: operands in a binary expr are
  // either literals or identifiers
  if (expr.left.type !== ESTree.NodeType.Literal) {
    const leftOperandTaint = new Taint(
      <ESTree.Identifier>expr.left,
      TaintType.normal,
      taintedAssignment.edge.source,
      taintedAssignment.edge,
      taintedAssignment.currentFunction,
      copyPropertyStack(taintedAssignment.propertyStack)
    );
    helper.worklist.push(leftOperandTaint);
    taint.nextTaints.push(leftOperandTaint);
    helper.dep.push(
      new TaintFlow(
        taint,
        leftOperandTaint,
        taintedAssignment.currentFunction.name,
        taintedAssignment.edge.label
      )
    );
  }
  if (expr.right.type !== ESTree.NodeType.Literal) {
    const rightOperandTaint = new Taint(
      <ESTree.Identifier>expr.right,
      TaintType.normal,
      taintedAssignment.edge.source,
      taintedAssignment.edge,
      taintedAssignment.currentFunction,
      copyPropertyStack(taintedAssignment.propertyStack)
    );
    helper.worklist.push(rightOperandTaint);
    taint.nextTaints.push(rightOperandTaint);
    helper.dep.push(
      new TaintFlow(
        taint,
        rightOperandTaint,
        taintedAssignment.currentFunction.name,
        taintedAssignment.edge.label
      )
    );
  }
}
