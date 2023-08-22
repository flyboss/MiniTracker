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
import { thisHandler } from './thisHandler';
import { logger } from '../../../../utils/logHelper';

export function identifierHandler(
  expr: ESTree.Identifier,
  taintedAssignment: TaintedAssignment,
  taint: Taint,
  helper: Helper,
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  if (expr.name === 'this') {
    thisHandler(expr, taintedAssignment, taint, helper, cfg, funcAliasMap);
    return;
  } else if (expr.name.startsWith('__lib__')) {
    sourceIdentifierHandler(
      expr,
      taintedAssignment,
      taint,
      helper,
      cfg,
      funcAliasMap
    );
  } else {
    normalIdentifierHandler(
      expr,
      taintedAssignment,
      taint,
      helper,
      cfg,
      funcAliasMap
    );
  }
}

function normalIdentifierHandler(
  expr: ESTree.Identifier,
  taintedAssignment: TaintedAssignment,
  taint: Taint,
  helper: Helper,
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  const identifierTaint = new Taint(
    expr,
    TaintType.normal,
    taintedAssignment.edge.source,
    taintedAssignment.edge,
    taintedAssignment.currentFunction,
    copyPropertyStack(taintedAssignment.propertyStack)
  );
  helper.worklist.push(identifierTaint);
  taint.nextTaints.push(identifierTaint);
  helper.dep.push(
    new TaintFlow(
      taint,
      identifierTaint,
      taintedAssignment.currentFunction.name,
      taintedAssignment.edge.label
    )
  );
}

function sourceIdentifierHandler(
  expr: ESTree.Identifier,
  taintedAssignment: TaintedAssignment,
  taint: Taint,
  helper: Helper,
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  let libName = expr.name;
  let taintToSource: Taint = null;
  logger.debug(`Source identifier encountered ${libName} from ${taint.name}`);
  for (let id of helper.sourceIdentifiers) {
    // __lib__id included in source.
    if (id === libName) {
      logger.trace(`Source identifier located. (${id})`);
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
  if (
    !taintToSource &&
    (helper.manager?.moduleAnalysis.utilAnalysisMode ||
      helper.manager?.moduleAnalysis.getAppAnalysisMode)
  ) {
    logger.trace(`lib identifier encountered in export flow: ${expr.name}`);
    taintToSource = new Taint(
      expr,
      TaintType.utilLib,
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

  normalIdentifierHandler(
    expr,
    taintedAssignment,
    taint,
    helper,
    cfg,
    funcAliasMap
  );
}
