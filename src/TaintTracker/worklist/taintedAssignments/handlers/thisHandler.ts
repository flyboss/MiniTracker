import * as ESTree from '../../../AFGGenerator/estree';
import { stringify } from '../../../AFGGenerator/parser/expressions/stringifier';
import * as Styx from '../../../AFGGenerator/generator';
import { Config } from '../../../../utils/config';
import { AliasMap } from '../../../functionAliasSearch/functionAliasMap';
import {
  checkForwardInclusion,
  convertStringToMemberExpr,
  splitStringIntoIdentifiers,
} from '../../../util/stringManip';
import { copyPropertyStack, matchProperty } from '../../../util/utils';
import { Helper } from '../../helper';
import {
  Taint,
  TaintedAssignment,
  TaintFlow,
  TaintType,
} from '../../../interfaces/taint';
import { logger } from '../../../../utils/logHelper';

export function thisHandler(
  expr: ESTree.MemberExpression | ESTree.Identifier,
  taintedAssignment: TaintedAssignment,
  taint: Taint,
  helper: Helper,
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  const stackCopy = copyPropertyStack(taintedAssignment.propertyStack);

  if (stringify(expr) !== 'this') {
    // RHS is a member expr containing 'this'
    // remove this. in original expr
    const fieldStack = splitStringIntoIdentifiers(
      stringify(expr).replace('this.', '')
    );
    for (const id of fieldStack) {
      stackCopy.push(id);
    }
  }
  // if RHS is only a 'this' identifier, we do nothing.

  const currentFuncAlias = taint.currentFunction.name;
  const funcAliasLists = funcAliasMap.getAllAliases(currentFuncAlias);
  for (const alias of funcAliasLists) {
    if (alias.includes('.')) {
      // For now we only consider calls like obj.callee()
      // Cases where arr[0]() is a valid function is not taken into consideration.
      const memberExpr = <ESTree.MemberExpression>(
        convertStringToMemberExpr(alias)
      );
      const objectName = memberExpr.object;
      thisObjectSearch(cfg, objectName, taint, stackCopy, helper, funcAliasMap);
    }
  }
}

function thisObjectSearch(
  cfg: Styx.FlowProgram,
  target: ESTree.Expression,
  taint: Taint,
  propertyStack: Array<ESTree.Identifier>,
  helper: Helper,
  funcAliasMap: AliasMap
) {
  for (const func of cfg.functions) {
    for (const edge of func.flowGraph.edges) {
      if (edge.type === Styx.EdgeType.Epsilon) continue;
      if (ESTree.isAssignmentExpression(edge.data)) {
        const assignmentExpr = edge.data;
        const LHSString = stringify(assignmentExpr.left);
        // Assert: LHS is either identifier or member expr
        let LHSExpr: ESTree.Identifier | ESTree.MemberExpression;
        if (assignmentExpr.left.type === ESTree.NodeType.Identifier) {
          LHSExpr = <ESTree.Identifier>assignmentExpr.left;
        } else if (
          assignmentExpr.left.type === ESTree.NodeType.MemberExpression
        ) {
          LHSExpr = <ESTree.MemberExpression>assignmentExpr.left;
        } else {
          if (!Config['ignore_warnings']) {
            logger.warn(
              `Unexpected LHS type ${assignmentExpr.left.type} in thisObjSearch.`
            );
          }
        }
        const TGTString = stringify(target);
        if (LHSString === TGTString) {
          // exact match
          const stackCopy = copyPropertyStack(propertyStack);
          const thisObjTaint = new Taint(
            LHSExpr,
            TaintType.normal,
            edge.source,
            edge,
            func,
            stackCopy
          );
          helper.worklist.push(thisObjTaint);
          taint.nextTaints.push(thisObjTaint);
          helper.dep.push(
            new TaintFlow(taint, thisObjTaint, func.name, edge.label)
          );
        } else if (checkForwardInclusion(LHSString, TGTString)) {
          // LHS includes TGT
          const stackCopy = copyPropertyStack(propertyStack);
          if (stackCopy.length) {
            let isPartialMatch = false;
            let remainderList = splitStringIntoIdentifiers(
              LHSString.replace(TGTString + '.', '')
            );
            while (matchProperty(remainderList, stackCopy)) {
              isPartialMatch = true;
            }
            if (isPartialMatch && !remainderList.length) {
              const thisObjTaint = new Taint(
                LHSExpr,
                TaintType.normal,
                edge.source,
                edge,
                func,
                stackCopy
              );
              helper.worklist.push(thisObjTaint);
              taint.nextTaints.push(thisObjTaint);
              helper.dep.push(
                new TaintFlow(taint, thisObjTaint, func.name, edge.label)
              );
            }
          }
        } else if (checkForwardInclusion(TGTString, LHSString)) {
          // TGT includes LHS
          const stackCopy = copyPropertyStack(propertyStack);
          const remainder = TGTString.replace(LHSString, '');
          if (remainder !== '') {
            const remainingIds = splitStringIntoIdentifiers(remainder);
            for (const id of remainingIds) {
              stackCopy.push(id);
            }
            const thisObjTaint = new Taint(
              LHSExpr,
              TaintType.normal,
              edge.source,
              edge,
              func,
              stackCopy
            );
            helper.worklist.push(thisObjTaint);
            taint.nextTaints.push(thisObjTaint);
            helper.dep.push(
              new TaintFlow(taint, thisObjTaint, func.name, edge.label)
            );
          }
        }
      }
    }
  }
}
