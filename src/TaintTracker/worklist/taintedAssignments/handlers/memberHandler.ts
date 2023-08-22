import { Config } from '../../../../utils/config';
import * as ESTree from '../../../AFGGenerator/estree';
import { stringify } from '../../../AFGGenerator/parser/expressions/stringifier';
import * as Styx from '../../../AFGGenerator/generator';
import { AliasMap } from '../../../functionAliasSearch/functionAliasMap';
import {
  checkForwardInclusion,
  splitStringIntoIdentifiers,
} from '../../../util/stringManip';
import { copyPropertyStack, matchProperty } from '../../../util/utils';
import { Helper } from '../../helper';
import { taintCallParameter } from '../../interProcedural';
import {
  Taint,
  TaintedAssignment,
  TaintFlow,
  TaintType,
} from '../../../interfaces/taint';
import { thisHandler } from './thisHandler';
import { logger } from '../../../../utils/logHelper';

export function memberHandler(
  expr: ESTree.MemberExpression,
  taintedAssignment: TaintedAssignment,
  taint: Taint,
  helper: Helper,
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  if (
    expr.object.type === ESTree.NodeType.Identifier &&
    (ESTree.isIdentifier(expr.object, { name: '$$params' }) ||
        ESTree.isIdentifier(expr.object, { name: 'arguments' }))
  ) {
    if (
      helper.manager?.moduleAnalysis.utilAnalysisMode ||
      helper.manager?.moduleAnalysis.getAppAnalysisMode
    ) {
      asideOnUtilSinkAnalysis(
        expr,
        taintedAssignment,
        taint,
        helper,
        cfg,
        funcAliasMap
      );
    }
    // special case: function parameter passing
    // get the id of parameter and taint all parameters in all calls to this function
    let paramIndex: number = 0;
    if (ESTree.isIdentifier(expr.property)) {
      paramIndex = Number.parseInt(expr.property.name);
    } else if (ESTree.isLiteral(expr.property)) {
      paramIndex = expr.property.value as number;
    }
    if (Number.isNaN(paramIndex)) {
      paramIndex = 0;
      logger.warn(`Cannot find parameter index ${stringify(expr)}`);
    }
    taintCallParameter(
      cfg,
      taintedAssignment.currentFunction,
      taintedAssignment,
      paramIndex,
      taint,
      helper,
      funcAliasMap
    );
  } else if (checkForwardInclusion(stringify(expr), 'this')) {
    thisHandler(expr, taintedAssignment, taint, helper, cfg, funcAliasMap);
  } else if (stringify(expr).startsWith('__lib__')) {
    // util functions (user defined libraries)
    sourceMemberHandler(
      expr,
      taintedAssignment,
      taint,
      helper,
      cfg,
      funcAliasMap
    );
  } else {
    // normal case: match property stack.
    normalMemberExprHandler(
      expr,
      taintedAssignment,
      taint,
      helper,
      cfg,
      funcAliasMap
    );
  }
}

function normalMemberExprHandler(
  expr: ESTree.MemberExpression,
  taintedAssignment: TaintedAssignment,
  taint: Taint,
  helper: Helper,
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  const memberIdentifierList = splitStringIntoIdentifiers(stringify(expr));
  const stackCopy = copyPropertyStack(taintedAssignment.propertyStack);
  if (taintedAssignment.propertyStack.length) {
    // while (matchProperty(memberIdentifierList, stackCopy)) {
      // intentially left empty here.
      // no matter matched or not, RHS will be marked as tainted
      // the only difference is what is in the property stack
    // }
  }
  const memberTaint = new Taint(
    expr,
    TaintType.normal,
    taintedAssignment.edge.source,
    taintedAssignment.edge,
    taintedAssignment.currentFunction,
    stackCopy
  );
  helper.worklist.push(memberTaint);
  taint.nextTaints.push(memberTaint);
  helper.dep.push(
    new TaintFlow(
      taint,
      memberTaint,
      taintedAssignment.currentFunction.name,
      taintedAssignment.edge.label
    )
  );
  if (expr.computed && Config['enable_implicit_flow']) {
    const propertyTaint = new Taint(
      expr,
      TaintType.implicit,
      taintedAssignment.edge.source,
      taintedAssignment.edge,
      taintedAssignment.currentFunction,
      stackCopy
    );
    logger.debug(
      '[WorkList] Tainted implicit flow:',
      stringify(expr),
      'at edge',
      taintedAssignment.edge.label,
      'in function',
      taint.currentFunction.name
    );

    helper.dep.push(
      new TaintFlow(
        taint,
        propertyTaint,
        taintedAssignment.currentFunction.name,
        taintedAssignment.edge.label
      )
    );
  }
}

function asideOnUtilSinkAnalysis(
  expr: ESTree.MemberExpression,
  taintedAssignment: TaintedAssignment,
  taint: Taint,
  helper: Helper,
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  let taintToParam = new Taint(
    expr,
    TaintType.utilSink,
    taintedAssignment.edge.source,
    taintedAssignment.edge,
    taintedAssignment.currentFunction,
    taintedAssignment.propertyStack
  );
  taintToParam.endsAtSource = true;
  taint.nextTaints.push(taintToParam);
  helper.dep.push(
    new TaintFlow(
      taint,
      taintToParam,
      taintedAssignment.currentFunction.name,
      taintedAssignment.edge.label
    )
  );
}

function sourceMemberHandler(
  expr: ESTree.MemberExpression,
  taintedAssignment: TaintedAssignment,
  taint: Taint,
  helper: Helper,
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  let libName = stringify(expr).split('.')[0];
  let taintToSource: Taint = null;
  for (let id of helper.sourceIdentifiers) {
    if (
      id.startsWith(libName) &&
      (checkForwardInclusion(
        id,
        taint.stringifyPropertyStackAsMemberExpression()
      ) ||
        checkForwardInclusion(
          taint.stringifyPropertyStackAsMemberExpression(),
          id
        ))
    ) {
      logger.trace(`Source member located. (${id})`);
      taintToSource = new Taint(
        expr,
        TaintType.normal,
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
      return;
    }
  }

  normalMemberExprHandler(
    expr,
    taintedAssignment,
    taint,
    helper,
    cfg,
    funcAliasMap
  );
}
