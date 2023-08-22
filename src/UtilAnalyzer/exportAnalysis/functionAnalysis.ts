import { BasicJs, Page } from '../../utils/interface/miniProgram';
import { locateSinkCalls as initializeWorklist } from '../../TaintTracker/worklist/interProcedural';
import { runWorklist } from '../../TaintTracker/worklist/taintedAssignments/taintedAssignments';
import { Helper } from '../../TaintTracker/worklist/helper';
import * as ESTree from '../../TaintTracker/AFGGenerator/estree';
import { Taint, TaintFlow, TaintType } from '../../TaintTracker/interfaces/taint';
import { isIdentifier } from '../../TaintTracker/AFGGenerator/estree';
import {
  generateDataFlow,
  generateGlobalDataFlow,
} from '../../TaintTracker/util/leakage/leakageGenerator';
import { DataLeakage, GlobalDataLeakage } from '../../TaintTracker/util/leakage/interface';
import { getCalleeString } from '../../TaintTracker/util/stringManip';
import { logger } from '../../utils/logHelper';
import { TrackingManager } from '../../miniTracker';

export enum FuncType {
  source,
  sink,
}

export class UtilsFunc {
  funcName: string;
  type: FuncType;

  constructor(funcName: string, type: FuncType) {
    this.funcName = funcName;
    this.type = type;
  }
}

export function getSinks(
  basicJs: BasicJs,
  manager: TrackingManager
): Set<string> {
  const newSinks = new Set<string>();
  const helper = new Helper();
  helper.manager = manager;
  initializeWorklist(basicJs.cfg, helper, basicJs.funcAliasMap);
  runWorklist(helper, basicJs);

  let sensitiveSinkCalls = new Array<DataLeakage>();
  let globalDataFlows = new Array<GlobalDataLeakage>();
  const localDataLeaks = new Array<DataLeakage>();
  for (const taintFlow of helper.dep) {
    if (
      taintFlow.source === null ||
      taintFlow.source?.type === TaintType.global
    ) {
      if (!manager.moduleAnalysis.getAppAnalysisMode) {
        // app.js will be analyzed independently,
        // so we wont do it here.
        globalDataFlows = globalDataFlows.concat(
          generateGlobalDataFlow(taintFlow.source ?? taintFlow.target)
        );
      }
    }
    if (taintFlow.source === null) {
      sensitiveSinkCalls = sensitiveSinkCalls.concat(
        generateDataFlow(taintFlow.target)
      );
    }
  }

  for (const call of sensitiveSinkCalls) {
    if (call.source.type === TaintType.utilSink) {
      const sinkAlias = getCalleeString(call.sink.controlFlowEdge.label);
      const sinkName = basicJs.funcAliasMap.getNameByAlias(sinkAlias);
      const currentFuncName = call.source.currentFunction.name;
      let libFuncName: string;
      if (manager.moduleAnalysis.getAppAnalysisMode) {
        libFuncName = getFuncNameForApp(currentFuncName, basicJs);
      } else if (manager.moduleAnalysis.utilAnalysisMode) {
        libFuncName = getFuncNameForExport(currentFuncName, basicJs);
      }
      if (!libFuncName) {
        continue;
      }
      if (!manager.moduleAnalysis.utilNameToAPIName.has(libFuncName)) {
        manager.moduleAnalysis.utilNameToAPIName.set(libFuncName, sinkName);
        logger.trace(`Set ${libFuncName} -> ${sinkName}`);
        newSinks.add(libFuncName);
      }
    } else {
      if (!manager.moduleAnalysis.getAppAnalysisMode) {
        const currentFuncName = call.source.currentFunction.name;
        localDataLeaks.push(call);
        logger.trace(
          `Util lib function ${currentFuncName} has a complete flow from source to sink.`
        );
      }
    }
  }

  manager.moduleAnalysis.utilLocalFlows.push({
    page: <Page>basicJs, // Note: Unsafe cast here.
    localDataLeaks: localDataLeaks,
    globalDataFlows: globalDataFlows,
    componentAnalysisResult: [],
  });

  return newSinks;
}

function initializeWorklistByReturnValues(helper: Helper, basicJs: BasicJs) {
  for (let func of basicJs.cfg.functions) {
    for (let edge of func.flowGraph.edges) {
      if (edge.data?.type === ESTree.NodeType.ReturnStatement) {
        // find callee's return statement
        let returnStmt = <ESTree.ReturnStatement>edge.data;
        // Assert: return statement will return either a literal or an identifier
        // only mark identifers
        if (
          isIdentifier(returnStmt.argument) &&
          returnStmt.argument.name !== 'undefined'
        ) {
          let identifierTaint = new Taint(
            <ESTree.Identifier>returnStmt.argument,
            TaintType.call,
            edge.source,
            edge,
            func,
            new Array<ESTree.Identifier>()
          );
          helper.worklist.push(identifierTaint);
          helper.dep.push(
            new TaintFlow(null, identifierTaint, func.name, edge.label)
          );
        }
      }
    }
  }
}

export function getSources(
  basicJs: BasicJs,
  manager: TrackingManager
): Set<string> {
  const newSources = new Set<string>();
  const helper = new Helper();
  helper.manager = manager;
  initializeWorklistByReturnValues(helper, basicJs);
  runWorklist(helper, basicJs);

  let sensitiveSourceCalls = new Array<DataLeakage>();
  for (const taintFlow of helper.dep) {
    if (taintFlow.source === null) {
      sensitiveSourceCalls = sensitiveSourceCalls.concat(
        generateDataFlow(taintFlow.target)
      );
    }
  }

  for (const call of sensitiveSourceCalls) {
    if (
      call.source.type === TaintType.utilSink ||
      call.source.type === TaintType.utilLib
    ) {
      continue;
    }
    const sourceAlias = getCalleeString(call.source.controlFlowEdge.label);
    const sourceName = basicJs.funcAliasMap.getNameByAlias(sourceAlias);
    for (const c of call.chain) {
      const currentFuncName = c.currentFunction.name;
      let libFuncName: string;
      if (manager.moduleAnalysis.getAppAnalysisMode) {
        libFuncName = getFuncNameForApp(currentFuncName, basicJs);
      } else if (manager.moduleAnalysis.utilAnalysisMode) {
        libFuncName = getFuncNameForExport(currentFuncName, basicJs);
      }
      if (!libFuncName) {
        continue;
      }
      if (!manager.moduleAnalysis.utilNameToAPIName.has(libFuncName)) {
        manager.moduleAnalysis.utilNameToAPIName.set(libFuncName, sourceName);
        newSources.add(libFuncName);
      }
    }
  }

  return newSources;
}

function getFuncNameForExport(alias: string, basicJs: BasicJs): string | null {
  const funcName = basicJs.funcAliasMap.getNameByAlias(alias);
  for (let name of basicJs.funcAliasMap.getAllAliases(funcName)) {
    if (name.startsWith('exports.')) {
      name = name.substring('exports.'.length);
    } else if (/^[a-z]\.exports/.test(name)) {
      name = name.substring('n.exports.'.length);
    } else if (name.startsWith('module.exports')) {
      name = name.substring('module.exports'.length);
    } else if (name.startsWith('temp')) {
      name = name.split('.')[1];
    } else {
      continue;
    }
    if (name) return basicJs.name + '.' + name;
  }
  return null;
}

function getFuncNameForApp(alias: string, app: BasicJs): string | null {
  const funcName = app.funcAliasMap.getNameByAlias(alias);
  for (let name of app.funcAliasMap.getAllAliases(funcName)) {
    if (name.startsWith('__AppParameter__')) {
      name = name.substring('__AppParameter__'.length);
    } else {
      continue;
    }
    if (name.length) return '__app__' + name;
  }
  return null;
}
