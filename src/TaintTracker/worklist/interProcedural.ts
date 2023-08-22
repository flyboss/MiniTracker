import * as Styx from '../AFGGenerator/generator';
import * as ESTree from '../AFGGenerator/estree';
import * as Flow from '../AFGGenerator/flow';
import { stringify } from '../AFGGenerator/parser/expressions/stringifier';
import {
  Taint,
  TaintedAssignment,
  TaintFlow,
  TaintType,
} from '../interfaces/taint';
import {FuncCallAndAssignment, Helper} from './helper';
import { copyPropertyStack } from '../util/utils';
import { AliasMap } from '../functionAliasSearch/functionAliasMap';
import {
  checkBackwardInclusion,
  splitStringIntoIdentifiers,
} from '../util/stringManip';
import { Config } from '../../utils/config';
import { logger } from '../../utils/logHelper';
import {FlowEdge} from "../AFGGenerator/generator";

export function taintCallReturnVal(
  cfg: Styx.FlowProgram,
  calleeAliases: string[],
  taintedAssignment: TaintedAssignment,
  helper: Helper,
  taintFrom: Taint
): boolean {
  // the first element of calleeAliases is funcName
  helper.callQueue.push(calleeAliases[0],taintedAssignment.edge,taintFrom.currentFunction);

  let returnValFound = false;
  for (const func of cfg.functions) {
    if (calleeAliases.includes(func.name)) {
      for (const edge of func.flowGraph.edges) {
        if (edge.data?.type === ESTree.NodeType.ReturnStatement) {
          // find callee's return statement
          const returnStmt = <ESTree.ReturnStatement>edge.data;
          // Assert: return statement will return either a literal or an identifier
          // only mark identifers
          if (
            ESTree.isIdentifier(returnStmt.argument) &&
            returnStmt.argument.name !== 'undefined'
          ) {
            returnValFound = true;
            const identifierTaint = new Taint(
              returnStmt.argument,
              TaintType.call,
              edge.source,
              edge,
              func,
              copyPropertyStack(taintedAssignment.propertyStack)
            );
            helper.worklist.push(identifierTaint);
            taintFrom.nextTaints.push(identifierTaint);
            helper.dep.push(
              new TaintFlow(
                taintFrom,
                identifierTaint,
                identifierTaint.currentFunction.name,
                edge.label
              )
            );
          }
        }
      }
    }
  }
  return returnValFound;
}

export function taintCallParameter(
  cfg: Styx.FlowProgram,
  taintedFunc: Styx.FlowFunction,
  taintedAssignment: TaintedAssignment,
  paramId: number,
  taintFrom: Taint,
  helper: Helper,
  funcAliasMap: AliasMap
) {
  /**
   * some parameters of a function are tainted
   * taint the arguments corresponding to parameters and
   * adds them to worklist.
   */
  const taintedFuncAlias = taintedFunc.name;
  const taintedFuncName = funcAliasMap.getNameByAlias(taintedFuncAlias);

  if (helper.callQueue.exist(taintedFuncName)){
    const funcCallAndAssignment=helper.callQueue.pop(taintedFuncName);
    taintParameter(funcCallAndAssignment.edge,funcCallAndAssignment.func);
  }else{
    for (const func of cfg.functions) {
      for (const edge of func.flowGraph.edges) {
        if (edge.type === Flow.EdgeType.Epsilon) {
          continue;
        }
        taintParameter(edge,func);
      }
    }
  }
  function taintParameter(edge:FlowEdge, func:Styx.FlowFunction) {
    const data = edge.data;
    if (data.type === ESTree.NodeType.AssignmentExpression) {
      // Assert: currently all edges we find by bfs are assignments
      const callExpr = <ESTree.AssignmentExpression>edge.data;
      if (callExpr.right.type === ESTree.NodeType.CallExpression) {
        // locate calls to current tainted function
        const currentCallExpr = <ESTree.CallExpression>callExpr.right;
        let currentCallName = funcAliasMap.getNameByAlias(
            currentCallExpr.callee
        );
        if (stringify(currentCallExpr.callee).startsWith('this')) {
          // this.xxx(), replace this with what this refers to,
          // by checking the alias objects of the context function.
          const contextFuncName = func.name;
          const contextFuncAliases =
              funcAliasMap.getAllAliases(contextFuncName);
          const taintedFuncAliases =
              funcAliasMap.getAllAliases(taintedFuncName);

          for (const contextAlias of contextFuncAliases) {
            const contextObject = contextAlias.split('.', 1)[0];
            const temp = stringify(currentCallExpr.callee).replace(
                'this',
                contextObject
            );
            if (taintedFuncAliases.includes(temp)) {
              currentCallName = funcAliasMap.getNameByAlias(temp);
            }
          }
        }
        if (currentCallName === taintedFuncName) {
          // Assert: all arguments of all call exprs are literals or identifers
          if (currentCallExpr.arguments.length <= paramId) {
            return;
          }
          const taintedArgument = <ESTree.Identifier>(
              currentCallExpr.arguments[paramId]
          );
          const taintedIdentifer = new Taint(
              taintedArgument,
              TaintType.call,
              edge.source,
              edge,
              func,
              copyPropertyStack(taintedAssignment.propertyStack)
          );
          helper.worklist.push(taintedIdentifer);
          taintFrom.nextTaints.push(taintedIdentifer);
          helper.dep.push(
              new TaintFlow(taintFrom, taintedIdentifer, func.name, edge.label)
          );
        }
      }
    }
  }
}

export function taintSinkArguments(
  func: Styx.FlowFunction,
  edge: Styx.FlowEdge,
  funcArguments: ESTree.Expression[],
  helper: Helper,
  sourceTaint: Taint
) {
  /**
   * This function marks the arguments of a function call as tainted
   * and adds them to worklist.
   */
  for (const argument of funcArguments) {
    // Assert: All arguments are identifiers or literals.
    if (argument.type === ESTree.NodeType.Literal) continue;
    const argIdentifer = <ESTree.Identifier>argument;
    const targetTaint = new Taint(
      argIdentifer,
      TaintType.normal,
      edge.source,
      edge,
      func,
      new Array<ESTree.Identifier>()
    );
    helper.worklist.push(targetTaint);
    sourceTaint?.nextTaints.push(targetTaint);
    helper.dep.push(
      new TaintFlow(sourceTaint, targetTaint, func.name, edge.label)
    );
    logger.debug(
      `[WorkList] Tainted function call argument: ${argIdentifer.name} at ${edge.label}`
    );
  }
}

function taintImplicitFlow(
  func: Styx.FlowFunction,
  edge: Styx.FlowEdge,
  helper: Helper
) {
  /**
   * This function track the implicit taint flow such as:
   *    if (test)
   *    {
   *        sink();
   *    }
   *
   *  sink -> test
   */
  const bfsQueue = new Array<Styx.FlowNode>();
  const visited = new Set<Styx.FlowNode>();
  const taintedEdges = new Array<TaintedAssignment>();

  bfsQueue.push(edge.source);
  while (bfsQueue.length !== 0) {
    const currentNode = bfsQueue.shift();
    if (!visited.has(currentNode)) {
      visited.add(currentNode);
      for (const incomingEdge of currentNode.incomingEdges) {
        if (incomingEdge.type === Styx.EdgeType.Conditional) {
          // get the test expr
          let Id: ESTree.Identifier;
          if (incomingEdge.data.type === ESTree.NodeType.Identifier) {
            Id = <ESTree.Identifier>incomingEdge.data;
          } else if (
            incomingEdge.data.type === ESTree.NodeType.UnaryExpression
          ) {
            const ue = <ESTree.UnaryExpression>incomingEdge.data;
            Id = <ESTree.Identifier>ue.argument;
          } else {
            if (!Config['ignore_warnings']) {
              console.warn(
                `[Worklist] invalid test type at ${incomingEdge.label} in ${func.name}`
              );
            }
            return;
          }
          const taintTo = new Taint(
            Id,
            TaintType.implicit,
            incomingEdge.source,
            incomingEdge,
            func,
            new Array<ESTree.Identifier>()
          );
          helper.worklist.push(taintTo);
          helper.dep.push(new TaintFlow(null, taintTo, func.name, edge.label));
          logger.debug(
            '[WorkList] Tainted implicit flow:',
            Id.name,
            'at edge',
            incomingEdge.label,
            'in function',
            func.name
          );
        }
      }
    }
  }
}

function checkGlobalDataAssignment(
  func: Styx.FlowFunction,
  edge: Styx.FlowEdge,
  expr: ESTree.Expression,
  helper: Helper
) {
  if (expr.type === ESTree.NodeType.MemberExpression) {
    const fields = splitStringIntoIdentifiers(stringify(expr));
    for (const field of fields) {
      if (field.name === 'globalData') {
        const globalDataTaint = new Taint(
          <ESTree.MemberExpression>expr,
          TaintType.global,
          edge.source,
          edge,
          func,
          new Array<ESTree.Identifier>()
        );
        logger.trace(`Tainted globalData ${stringify(expr)}`);
        helper.worklist.push(globalDataTaint);
      }
    }
  }
}

export function locateSinkCalls(
  cfg: Styx.FlowProgram,
  helper: Helper,
  funcAliasMap: AliasMap
) {
  /**
   * 1. locates all sink calls and marks their arguments as tainted.
   * 2. if LHS of a assignment contains 'global', make it as tainted.
   */
  for (const func of cfg.functions) {
    for (const edge of func.flowGraph.edges) {
      if (edge.type === Styx.EdgeType.Epsilon) {
        continue;
      }
      const data = edge.data;
      if (data.type === ESTree.NodeType.AssignmentExpression) {
        // Assert: all call expressions appear in RHS of assignments
        const RHSExpr = (<ESTree.AssignmentExpression>data).right;
        if (RHSExpr.type === ESTree.NodeType.CallExpression) {
          const callExpr = RHSExpr as ESTree.CallExpression;
          const alias = stringify(callExpr.callee);
          const name = funcAliasMap.getNameByAlias(alias);
          let isSinkCall = false;
          if (Config['strict_matching']) {
            // in strict matching mode, we only check for exact matches
            isSinkCall = helper.sinkFunctions.includes(name);
          } else {
            // or otherwise we also check inclusions
            for (const sink of helper.sinkFunctions) {
              const rawAPI = sink.replace(Config['api_prefix'], '');
              if (checkBackwardInclusion(alias, rawAPI)) {
                isSinkCall = true;
                break;
              }
            }
            isSinkCall = isSinkCall || helper.sinkFunctions.includes(name);
          }
          if (isSinkCall) {
            // got a sink function call
            logger.debug(`Added taint at sink: ${alias} (alias of ${name})`);
            taintSinkArguments(func, edge, callExpr.arguments, helper, null);

            // add implicit flow if required
            if (Config['enable_implicit_flow']) {
              taintImplicitFlow(func, edge, helper);
            }
          }
        }
        const LHSExpr = (<ESTree.AssignmentExpression>data).left;
        checkGlobalDataAssignment(func, edge, LHSExpr, helper);
      }
    }
  }
}
