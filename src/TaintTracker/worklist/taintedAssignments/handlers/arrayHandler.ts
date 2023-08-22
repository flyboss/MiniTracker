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

export function arrayExprHandler(
  expr: ESTree.ArrayExpression,
  taintedAssignment: TaintedAssignment,
  taint: Taint,
  helper: Helper,
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  for (const element of expr.elements) {
    if (ESTree.isIdentifier(element)) {
      const elementTaint = new Taint(
        element,
        TaintType.normal,
        taintedAssignment.edge.source,
        taintedAssignment.edge,
        taintedAssignment.currentFunction,
        copyPropertyStack(taintedAssignment.propertyStack)
      );
      helper.worklist.push(elementTaint);
      taint.nextTaints.push(elementTaint);
      helper.dep.push(
        new TaintFlow(
          taint,
          elementTaint,
          taintedAssignment.currentFunction.name,
          taintedAssignment.edge.label
        )
      );
    }
  }
}
