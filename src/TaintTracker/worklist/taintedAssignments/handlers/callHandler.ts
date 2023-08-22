import * as ESTree from '../../../AFGGenerator/estree';
import * as Styx from '../../../AFGGenerator/generator';
import { stringify } from '../../../AFGGenerator/parser/expressions/stringifier';
import { Helper } from '../../helper';
import { taintCallReturnVal } from '../../interProcedural';
import {
  Taint,
  TaintedAssignment,
  TaintFlow,
  TaintType,
} from '../../../interfaces/taint';
import { AliasMap } from '../../../functionAliasSearch/functionAliasMap';
import { Config } from '../../../../utils/config';
import { copyPropertyStack } from '../../../util/utils';
import { checkBackwardInclusion } from '../../../util/stringManip';
import { logger } from '../../../../utils/logHelper';

export function callHandler(
  expr: ESTree.CallExpression,
  taintedAssignment: TaintedAssignment,
  taint: Taint,
  helper: Helper,
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  // For function calls, we track backward from return values.
  // Assert: call expression found here must have return values.
  let funcAlias = stringify(expr.callee);
  if (funcAlias.startsWith('this')) {
    funcAlias = resolveThisMemberFunction(
      funcAlias,
      taintedAssignment.currentFunction,
      funcAliasMap
    );
  }
  const funcName = funcAliasMap.getNameByAlias(funcAlias);
  if (funcName === '') {
    unknownCalleeHandler(
      expr,
      taintedAssignment,
      taint,
      helper,
      cfg,
      funcAliasMap
    );
  }
  let isSourceCall = false;
  if (Config['strict_matching']) {
    isSourceCall = helper.sourceFunctions.includes(funcName);
  } else {
    for (let source of helper.sourceFunctions) {
      let rawAPI = source.replace(Config['api_prefix'], '');
      if (checkBackwardInclusion(funcAlias, rawAPI)) {
        isSourceCall = true;
        break;
      }
    }
    isSourceCall = isSourceCall || helper.sourceFunctions.includes(funcName);
  }
  if (isSourceCall) {
    logger.debug(`Source located (${funcName}).`);
    let calleeExpr: ESTree.Identifier | ESTree.MemberExpression;
    if (expr.callee.type === ESTree.NodeType.Identifier) {
      calleeExpr = <ESTree.Identifier>expr.callee;
    } else if (expr.callee.type === ESTree.NodeType.MemberExpression) {
      calleeExpr = <ESTree.MemberExpression>expr.callee;
    }
    const taintToSource = new Taint(
      calleeExpr,
      TaintType.call,
      taintedAssignment.edge.source,
      taintedAssignment.edge,
      taintedAssignment.currentFunction,
      taintedAssignment.propertyStack
    );
    taintToSource.endsAtSource = true;
    taint.nextTaints.push(taintToSource);
    helper.dep.push(
      new TaintFlow(
        taint,
        taintToSource,
        taintedAssignment.currentFunction.name,
        taintedAssignment.edge.label
      )
    );
  }
  if (funcAliasMap.getAllAliases(funcName).length) {
    if (
      !taintCallReturnVal(
        cfg,
        funcAliasMap.getAllAliases(funcName),
        taintedAssignment,
        helper,
        taint
      ) &&
      !(
        helper.sourceFunctions.includes(funcName) ||
        helper.sinkFunctions.includes(funcName)
      )
      // TODO: optimize this hard-coded patch
    ) {
      // no valid return value. Taint parameter instead.
      unknownCalleeHandler(
        expr,
        taintedAssignment,
        taint,
        helper,
        cfg,
        funcAliasMap
      );
    }
  }
}

function resolveThisMemberFunction(
  funcAlias: string,
  enclosingFunction: Styx.FlowFunction,
  funcAliasMap: AliasMap
) {
  const funcMethod = funcAlias.substr('this.'.length);
  const enclosingFuncName = enclosingFunction.name;
  const enclosingFuncAliases = funcAliasMap.getAllAliases(enclosingFuncName);
  for (const alias of enclosingFuncAliases) {
    if (alias.includes('.')) {
      const enclosingObj = alias.split('.')[0];
      const resolvedFuncName = enclosingObj.concat('.', funcMethod);
      if (funcAliasMap.getNameByAlias(resolvedFuncName) !== '') {
        return resolvedFuncName;
      }
    }
  }
  return funcAlias;
}

function unknownCalleeHandler(
  expr: ESTree.CallExpression,
  taintedAssignment: TaintedAssignment,
  taint: Taint,
  helper: Helper,
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  for (const arg of expr.arguments) {
    if (ESTree.isIdentifier(arg)) {
      const argTaint = new Taint(
        arg,
        TaintType.call,
        taintedAssignment.edge.source,
        taintedAssignment.edge,
        taintedAssignment.currentFunction,
        copyPropertyStack(taint.propertyStack)
      );
      helper.worklist.push(argTaint);
      taint.nextTaints.push(argTaint);
      helper.dep.push(
        new TaintFlow(
          taint,
          argTaint,
          taintedAssignment.currentFunction.name,
          taintedAssignment.edge.label
        )
      );
    }
  }
}
