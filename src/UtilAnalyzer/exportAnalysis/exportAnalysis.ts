import { ExportUnit, JsFile } from '../../utils/interface/miniProgram';
import { runWorklist } from '../../TaintTracker/worklist/taintedAssignments/taintedAssignments';
import { Helper } from '../../TaintTracker/worklist/helper';
import { logger } from '../../utils/logHelper';
import * as ESTree from '../../TaintTracker/AFGGenerator/estree';
import { Taint, TaintFlow, TaintType } from '../../TaintTracker/interfaces/taint';
import {
  getSourceAndSink,
  updateSourceAndSinkFunctions,
} from '../../TaintTracker/util/sourceAndSinkHelper';
import { stringify } from '../../TaintTracker/AFGGenerator/parser/expressions/stringifier';
import { DataLeakage } from '../../TaintTracker/util/leakage/interface';
import { generateDataFlow } from '../../TaintTracker/util/leakage/leakageGenerator';
import { FlowNode } from '../../TaintTracker/AFGGenerator/flow';
import { getCalleeString } from '../../TaintTracker/util/stringManip';
import { TrackingManager } from '../../miniTracker';

function initializeWorklistByExport(helper: Helper, jsFile: JsFile) {
  logger.trace('Searching for exports. or module.exports.');
  for (const func of jsFile.cfg.functions) {
    for (const edge of func.flowGraph.edges) {
      if (ESTree.isAssignmentExpression(edge.data)) {
        const assignmentExpr = edge.data;
        if (assignmentExpr.left.type === ESTree.NodeType.MemberExpression) {
          if (
            stringify(assignmentExpr.left).startsWith('exports.') ||
            stringify(assignmentExpr.left).startsWith('module.exports.')
          ) {
            // find exports.something = blahblah;
            logger.trace(`Added export attribute ${stringify(assignmentExpr)}`);

            let exportTaint = new Taint(
              <ESTree.MemberExpression>assignmentExpr.left,
              TaintType.normal,
              edge.source,
              edge,
              func,
              new Array<ESTree.Identifier>()
            );
            helper.worklist.push(exportTaint);
            helper.dep.push(
              new TaintFlow(null, exportTaint, func.name, edge.label)
            );
          }
        }
      }
    }
  }
  logger.trace('Done.');
}

function findModuleExport(helper: Helper, jsFile: JsFile) {
  /**
   * Finds module.export = RHS
   * Adds RHS to jsFile.moduleExportObj as an ExportUnit
   * Returns the edge (used later in BFS initialization)
   *
   * Note: RHS should be either an identifier or a literal,
   *       we only handle identifiers.
   */
  logger.trace('Searching for module.exports');
  for (const func of jsFile.cfg.functions) {
    for (const edge of func.flowGraph.edges) {
      if (ESTree.isAssignmentExpression(edge.data)) {
        if (stringify(edge.data.left) === 'module.exports') {
          if (ESTree.isIdentifier(edge.data.right)) {
            jsFile.moduleExportObj = new ExportUnit(stringify(edge.data.right));
            logger.trace(
              `Added module.exports object: ${jsFile.moduleExportObj.name}`
            );
            return { func: func, edge: edge };
          } else if (ESTree.isLiteral(edge.data.right)) {
            logger.trace(
              `module.exports RHS is a literal: ${edge.data.right.value}. Skipping.`
            );
            return { func: null, edge: null };
          } else {
            logger.warn(
              `Unexpected RHS type in findModuleExport: ${edge.data.right.type} (at ${jsFile.name})`
            );
            return { func: null, edge: null };
          }
        }
      }
    }
  }

  logger.trace(`module.exports not found in ${jsFile.name}. Skipping.`);
  return { func: null, edge: null };
}

function initializeWorklistByModuleExports(helper: Helper, jsFile: JsFile) {
  const { func: func, edge: bfsStartingEdge } = findModuleExport(
    helper,
    jsFile
  );

  if (bfsStartingEdge) {
    const bfsHelper = {
      queue: new Array<FlowNode>(),
      done: new Set<number>(),
    };

    bfsHelper.queue.push(bfsStartingEdge.source);
    while (bfsHelper.queue.length) {
      const currentNode = bfsHelper.queue.shift();

      if (bfsHelper.done.has(currentNode.id)) {
        continue;
      }
      bfsHelper.done.add(currentNode.id);

      for (const inEdge of currentNode.incomingEdges) {
        if (ESTree.isAssignmentExpression(inEdge.data)) {
          if (
            ESTree.isIdentifier(inEdge.data.left) &&
            inEdge.data.left.name === jsFile.moduleExportObj.name
          ) {
            // moduleExportObj = something
            if (ESTree.isIdentifier(inEdge.data.right)) {
              // moduleExportObj = id
              // update moduleExportObj
              jsFile.moduleExportObj = new ExportUnit(inEdge.data.right.name);
              logger.trace(
                `Updated moduleExportObj from ${inEdge.data.left.name} to ${inEdge.data.right.name}`
              );
            } else {
              logger.warn(
                `Unexpected RHS type in module.export BFS: ${inEdge.data.right.type}`
              );
            }
          } else if (
            ESTree.isMemberExpression(inEdge.data.left) &&
            stringify(inEdge.data.left).startsWith(jsFile.moduleExportObj.name)
          ) {
            // moduleExportObj.xxx = a;
            logger.trace(`Added module.exports attribute ${inEdge.label}`);

            let moduleExportTaint = new Taint(
              inEdge.data.left,
              TaintType.normal,
              inEdge.source,
              inEdge,
              func,
              new Array<ESTree.Identifier>()
            );

            helper.worklist.push(moduleExportTaint);
            helper.dep.push(
              new TaintFlow(null, moduleExportTaint, func.name, inEdge.label)
            );
          }
        }
        if (!bfsHelper.done.has(inEdge.source.id)) {
          bfsHelper.queue.push(inEdge.source);
        }
      }
    }
  }
}

function getTaintedExports(
  helper: Helper,
  jsFile: JsFile,
  manager: TrackingManager
): Array<string> {
  /**
   * Find and return tainted identifiers.
   */
  let taintedExports = new Array<DataLeakage>();
  const taintedIdentifiers = new Array<string>();

  for (let flow of helper.dep) {
    if (flow.source === null) {
      taintedExports = taintedExports.concat(generateDataFlow(flow.target));
    }
  }

  for (let ex of taintedExports) {
    // rename
    let identifierName = ex.sink.name;
    if (identifierName.startsWith('exports.')) {
      identifierName = identifierName.substring('exports.'.length);
    } else if (identifierName.startsWith('module.exports.')) {
      identifierName = identifierName.substring('module.exports.'.length);
    } else {
      const exportObjName = identifierName.split('.', 1)[0];
      identifierName = identifierName.substring(exportObjName.length);
      if (identifierName.startsWith('.')) {
        identifierName = identifierName.substring('.'.length);
      }
    }

    if (ex.source.type === TaintType.utilLib) {
      // alias of other libs (linked to __lib__s)
      const newSources = new Array<string>();
      const newSinks = new Array<string>();

      logger.trace(`Alias of ${ex.source.name}: ${identifierName}`);
      let {
        sourceFunctions: sourceFuncs,
        sinkFunctions: sinkFuncs,
        sourceIdentifiers: sourceIds,
      } = getSourceAndSink();
      for (let source of sourceFuncs) {
        if (source.startsWith(ex.source.name)) {
          newSources.push(source.replace(ex.source.name, identifierName));
        }
      }
      for (let sink of sinkFuncs) {
        if (sink.startsWith(ex.source.name)) {
          newSinks.push(sink.replace(ex.source.name, identifierName));
        }
      }
      for (let id of sourceIds) {
        if (id.startsWith(ex.source.name)) {
          taintedIdentifiers.push(id.replace(ex.source.name, identifierName));
        }
      }

      updateSourceAndSinkFunctions(
        Array.from(newSources),
        Array.from(newSinks)
      );
    } else {
      // tainted identifiers (linked to source APIs)
      const taintedIdentifierName = identifierName.length
        ? jsFile.name + '.' + identifierName
        : jsFile.name;
      const sourceFuncName = getCalleeString(ex.source.controlFlowEdge.label);
      manager.moduleAnalysis.utilNameToAPIName.set(
        taintedIdentifierName,
        sourceFuncName
      );
      taintedIdentifiers.push(taintedIdentifierName);
    }
  }

  return taintedIdentifiers;
}

export function getTaintedIdentifiers(
  jsFile: JsFile,
  manager: TrackingManager
) {
  /**
   * Run worklist algorithm on util js files.
   * Returns exported identifiers that have values from a source API.
   * These identifiers are regarded as sources in the following analysis.
   */
  const helper = new Helper();
  helper.manager = manager;
  initializeWorklistByExport(helper, jsFile);
  initializeWorklistByModuleExports(helper, jsFile);
  runWorklist(helper, jsFile);
  return getTaintedExports(helper, jsFile, manager);
}
