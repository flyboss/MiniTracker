import {
  BasicJs,
  ExportUnit,
  JsFile,
  Page,
} from '../../utils/interface/miniProgram';
import { Helper } from '../../TaintTracker/worklist/helper';
import * as ESTree from '../../TaintTracker/AFGGenerator/estree';
import { logger } from '../../utils/logHelper';

import { stringify } from '../../TaintTracker/AFGGenerator/parser/expressions/stringifier';
import { Taint, TaintFlow, TaintType } from '../../TaintTracker/interfaces/taint';
import { runWorklist } from '../../TaintTracker/worklist/taintedAssignments/taintedAssignments';
import { DataLeakage } from '../../TaintTracker/util/leakage/interface';
import { generateDataFlow } from '../../TaintTracker/util/leakage/leakageGenerator';
import { processAndParsePage } from '../../TaintTracker/util/frontEnd';
import { performAliasSearch } from '../../TaintTracker/functionAliasSearch/functionAliasMap';
import { extraPasses } from '../../TaintTracker/asyncFlow/callbackPass';
import {
  getSourceAndSink,
  updateSourceAndSinkFunctions,
  updateSourceIdentifiers,
} from '../../TaintTracker/util/sourceAndSinkHelper';
import {
  UtilsFunc,
  getSinks,
  getSources,
  FuncType,
} from '../exportAnalysis/functionAnalysis';
import { TrackingManager } from '../../miniTracker';

// export let getAppAnalysisHelper: Array<UtilsFunc>;
// export let getAppAnalysisMode: boolean;

function getAppCallArgument(helper: Helper, app: Page) {
  /**
   * Finds call to App() and returns its parameter.
   */
  for (const func of app.cfg.functions) {
    for (const edge of func.flowGraph.edges) {
      if (
        ESTree.isAssignmentExpression(edge.data) &&
        ESTree.isCallExpression(edge.data.right) &&
        ESTree.isIdentifier(edge.data.right.callee, { name: 'App' })
      ) {
        logger.info(`Call to App() located: ${edge.label}`);
        return edge.data.right.arguments[0] as ESTree.Identifier;
      }
    }
  }

  logger.warn(`Call to App() not found in ${app.filepath}.`);
  return null;
}

function updateAppParamName(helper: Helper, basicJs: BasicJs) {
  /**
   * Updates call parameter of App() until convergence.
   *
   * eg. temp1.x = ...
   *     temp1.y = ... (some object expression parsed by styx)
   *     temp2 = temp1
   *     temp3 = App(temp2) // we add temp2, but what we really need is temp1
   *
   * Note: This function should be correct as long as
   *       App() is called in the form of App(ObjectExpression)
   */
  let converged = false;
  while (!converged) {
    converged = true;
    for (const func of basicJs.cfg.functions) {
      for (const edge of func.flowGraph.edges) {
        if (ESTree.isAssignmentExpression(edge.data)) {
          const assignmentExpr = edge.data;
          if (assignmentExpr.left.type === ESTree.NodeType.Identifier) {
            if (
              basicJs.moduleExportObj &&
              stringify(assignmentExpr.left).startsWith(
                basicJs.moduleExportObj.name
              )
            ) {
              // obj = {}; => temp = {}; obj = temp;
              // should search for temp instead of obj;
              if (
                assignmentExpr.right.type !== ESTree.NodeType.Identifier &&
                assignmentExpr.right.type !== ESTree.NodeType.Literal
              ) {
                logger.warn(
                  `Unexpected RHS type in updateExportedName: ${assignmentExpr.right.type} (at ${basicJs.filepath})`
                );
              }
              // assert: RHS must be identifier or literal.
              let updatedExportObjName = stringify(assignmentExpr.right);
              logger.trace(
                `Updated exportVariable: ${basicJs.moduleExportObj.name} --> ${updatedExportObjName}`
              );
              basicJs.moduleExportObj = new ExportUnit(updatedExportObjName);
              converged = false;
            }
          }
        }
      }
    }
  }
}

function initializeWorklistByAppCall(helper: Helper, app: Page) {
  let appParameter = getAppCallArgument(helper, app);
  if (appParameter) {
    app.moduleExportObj = new ExportUnit(appParameter.name);
  } else {
    app.moduleExportObj = null;
  }

  // Note: this update assumes App() is always called in the form of
  // App({objectExpression})
  updateAppParamName(helper, app);

  for (const func of app.cfg.functions) {
    for (const edge of func.flowGraph.edges) {
      if (ESTree.isAssignmentExpression(edge.data)) {
        const assignmentExpr = edge.data;
        if (ESTree.isMemberExpression(assignmentExpr.left)) {
          if (
            app.moduleExportObj &&
            stringify(assignmentExpr.left).startsWith(app.moduleExportObj.name)
          ) {
            logger.trace(
              `Added getApp() attribute ${stringify(assignmentExpr)}`
            );

            let getAppTaint = new Taint(
              assignmentExpr.left,
              TaintType.normal,
              edge.source,
              edge,
              func,
              new Array<ESTree.Identifier>()
            );
            helper.worklist.push(getAppTaint);
            helper.dep.push(
              new TaintFlow(null, getAppTaint, func.name, edge.label)
            );
          }
        }
      }
    }
  }
}

function getTaintedAppAttributes(app: Page, manager: TrackingManager) {
  const helper = new Helper();
  helper.manager = manager;
  initializeWorklistByAppCall(helper, app);
  runWorklist(helper, app);

  let taintedAttrs = new Array<DataLeakage>();
  const taintedIdentifiers = new Array<string>();

  for (let flow of helper.dep) {
    if (flow.source === null) {
      taintedAttrs = taintedAttrs.concat(generateDataFlow(flow.target));
    }
  }

  let appParameter = app.moduleExportObj?.name ?? '';

  for (let taintedAttr of taintedAttrs) {
    // rename
    let identifierName = taintedAttr.sink.name;
    if (identifierName.startsWith(appParameter)) {
      identifierName = identifierName.substring(appParameter.length);
      if (identifierName.startsWith('.')) {
        identifierName = identifierName.substring('.'.length);
      }
    }

    identifierName = identifierName.length
      ? '__app__.' + identifierName
      : '__app__';

    if (taintedAttr.source.type === TaintType.utilLib) {
      // alias of other libs (linked to __lib__s)
      const newSources = new Array<string>();
      const newSinks = new Array<string>();

      logger.trace(`Alias of ${taintedAttr.source.name}: ${identifierName}`);
      let {
        sourceFunctions: sourceFuncs,
        sinkFunctions: sinkFuncs,
        sourceIdentifiers: sourceIds,
      } = getSourceAndSink();
      for (let source of sourceFuncs) {
        if (source.startsWith(taintedAttr.source.name)) {
          newSources.push(
            source.replace(taintedAttr.source.name, identifierName)
          );
        }
      }
      for (let sink of sinkFuncs) {
        if (sink.startsWith(taintedAttr.source.name)) {
          newSinks.push(sink.replace(taintedAttr.source.name, identifierName));
        }
      }
      for (let id of sourceIds) {
        if (id.startsWith(taintedAttr.source.name)) {
          taintedIdentifiers.push(
            id.replace(taintedAttr.source.name, identifierName)
          );
        }
      }

      updateSourceAndSinkFunctions(
        Array.from(newSources),
        Array.from(newSinks)
      );
    } else {
      taintedIdentifiers.push(identifierName);
    }
  }

  logger.trace(`All tainted attributes in App(): ${taintedIdentifiers}`);

  return taintedIdentifiers;
}

export function dealGetApp(app: Page, manager: TrackingManager) {
  // get cfg
  if (app.js === undefined || app.js === '') {
    logger.warn(`[Worklist] Empty app.js ${app.name}. Skipping.`);
    return undefined;
  }
  app.cfg = processAndParsePage(app);
  performAliasSearch(app);
  extraPasses(app.cfg, app.funcAliasMap, app.filepath);

  // getAppAnalysisHelper = new Array<UtilsFunc>();
  manager.moduleAnalysis.getAppAnalysisMode = true;

  logger.info('Analyzing Sinks of app.js');
  const newSinks = getSinks(app, manager);
  logger.info('Analyzing Sources of app.js');
  const newSources = getSources(app, manager);

  // const newSources = new Set<string>();
  // const newSinks = new Set<string>();
  // for (const appFunc of getAppAnalysisHelper) {
  //   if (appFunc.type === FuncType.source) {
  //     getFuncName(appFunc.funcName, app).forEach((item) =>
  //       newSources.add(item)
  //     );
  //   } else {
  //     getFuncName(appFunc.funcName, app).forEach((item) => newSinks.add(item));
  //   }
  // }

  updateSourceAndSinkFunctions(Array.from(newSources), Array.from(newSinks));

  logger.info('Analyzing Identifiers of app.js');
  updateSourceIdentifiers(getTaintedAppAttributes(app, manager));

  // getAppAnalysisHelper = void 0;
  manager.moduleAnalysis.getAppAnalysisMode = false;
}
