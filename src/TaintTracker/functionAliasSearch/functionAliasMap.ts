import * as ESTree from '../AFGGenerator/estree';
import { stringify } from '../AFGGenerator/parser/expressions/stringifier';
import { BasicJs } from '../../utils/interface/miniProgram';
import { getSourceAndSink } from '../util/sourceAndSinkHelper';
import { logger } from '../../utils/logHelper';
import * as Styx from '../AFGGenerator/generator';
import { Alias, AliasHelper } from './interface/alias';
import {
  checkForwardInclusion,
  splitStringIntoIdentifiers,
} from '../util/stringManip';
import { copyPropertyStack, matchProperty } from '../util/utils';

export class CompactFunctionInfo {
  name: string;
  parameters: Array<ESTree.Identifier>;
  returnValues: Array<ESTree.Identifier>;

  constructor(
    name: string,
    params?: Array<ESTree.Identifier>,
    returnValues?: Array<ESTree.Identifier>
  ) {
    this.name = name;
    this.parameters = params ?? new Array<ESTree.Identifier>();
    this.returnValues = returnValues ?? new Array<ESTree.Identifier>();
  }
}

export class AliasMap {
  aliasToName: { [alias: string]: string };
  nameToAlias: { [name: string]: Set<string> };
  nameToCompactInfo: { [name: string]: CompactFunctionInfo };

  constructor(initialNames: string[]) {
    this.aliasToName = {};
    this.nameToAlias = {};
    this.nameToCompactInfo = {};
    for (const name of initialNames) {
      if (!this.nameToAlias[name]) {
        this.nameToAlias[name] = new Set<string>([name]);
        this.aliasToName[name] = name;
        this.nameToCompactInfo[name] = new CompactFunctionInfo(name);
      }
    }
  }

  public addAliasNamePair(alias: string, name: string) {
    this.aliasToName[alias] = name;
    this.nameToAlias[name].add(alias);
  }

  public getNameByAlias(alias: string | ESTree.Expression): string {
    if (ESTree.isExpression(alias)) {
      alias = stringify(alias);
    }
    if (this.aliasToName.hasOwnProperty(alias)) {
      return this.aliasToName[alias];
    } else {
      return '';
    }
  }

  public getAllAliases(name: string): Array<string> {
    /**
     * Returns a list of all aliases of a given function.
     *
     * @param {string} name: the name or alias of the function to be looked up.
     *
     * @returns {Array<string>}: A list of aliases.
     *        null will be returned if the query is not found.
     */
    name = this.aliasToName[name];
    if (this.nameToAlias.hasOwnProperty(name)) {
      return Array.from(this.nameToAlias[name]);
    } else {
      return [];
    }
  }

  public getFunctionInfo(name: string): CompactFunctionInfo {
    /**
     * Returns the CompactFunctionInfo of a designated function.
     *
     * @param {string} name: the name or alias of the function to be looked up.
     *
     * @returns {CompactFunctionInfo | null}: The function info.
     *        null will be returned if the query is not found.
     */
    name = this.aliasToName[name];
    if (this.nameToCompactInfo.hasOwnProperty(name)) {
      return this.nameToCompactInfo[name];
    } else {
      return null;
    }
  }
}

export function performAliasSearch(basicJs: BasicJs) {
  const {
    sourceFunctions: sourceFunctions,
    sinkFunctions: sinkFunctions,
    sourceIdentifiers: sourceIdentifiers,
  } = getSourceAndSink();
  const functionNames = new Array<string>().concat(
    sinkFunctions,
    sourceFunctions
  );
  for (const func of basicJs.cfg.functions) {
    functionNames.push(func.name);
  }

  basicJs.funcAliasMap = new AliasMap(functionNames);
  functionAliasSearch(basicJs.cfg, functionNames, basicJs.funcAliasMap);
  logger.trace('[Worklist] Extracting function info');

  extractCompactFunctionInfo(basicJs.cfg, basicJs.funcAliasMap);

  // Only output function with alias to get concise output
  for (let t of functionNames) {
    if (basicJs.funcAliasMap.nameToAlias[t].size > 1) {
      logger.trace(
        `  - ${t} -> ${Array.from(basicJs.funcAliasMap.nameToAlias[t])}`
      );
    }
  }
}

function extractCompactFunctionInfo(
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap
) {
  for (const func of cfg.functions) {
    funcAliasMap.nameToCompactInfo[func.name].parameters = Array.from(
      func.parameters
    );
    funcAliasMap.nameToCompactInfo[func.name].returnValues = Array.from(
      func.returnValues
    );
  }
}

function functionAliasSearch(
  cfg: Styx.FlowProgram,
  functionName: string[],
  funcAliasMap: AliasMap
) {
  const aliasHelper = new AliasHelper();
  for (const func of cfg.functions) {
    aliasHelper.funcs.set(func.name, func);
  }

  for (const func of cfg.functions) {
    for (const edge of func.flowGraph.edges) {
      if (edge.type === Styx.EdgeType.Epsilon) continue;
      if (edge.data.type === ESTree.NodeType.AssignmentExpression) {
        const assignmentExpr = edge.data as ESTree.AssignmentExpression;
        const RHSString = stringify(assignmentExpr.right);
        for (const name of functionName) {
          if (checkForwardInclusion(name, RHSString)) {
            // exact or inexact matches
            const remainder = name.replace(RHSString, '');
            if (remainder === '') {
              // exact match, add LHS to alias dict
              funcAliasMap.addAliasNamePair(
                stringify(assignmentExpr.left),
                name
              );
            }
            const propertyStack = splitStringIntoIdentifiers(remainder);
            if (assignmentExpr.left.type === ESTree.NodeType.MemberExpression) {
              // case 1: LHS is member expr
              aliasHelper.worklist.push(
                new Alias(
                  assignmentExpr.left as ESTree.MemberExpression,
                  edge,
                  name,
                  func,
                  propertyStack
                )
              );
            } else if (
              assignmentExpr.left.type === ESTree.NodeType.Identifier
            ) {
              // case 2: LHS is an identifier
              aliasHelper.worklist.push(
                new Alias(
                  assignmentExpr.left as ESTree.Identifier,
                  edge,
                  name,
                  func,
                  propertyStack
                )
              );
            }
          }
        }
      }
    }
  }
  while (aliasHelper.worklist.length) {
    let current = aliasHelper.worklist.shift();
    aliasHelper.done.push(current.uniqueName);
    BFSAliasSearch(current, funcAliasMap, aliasHelper);
  }
}

export function BFSAliasSearch(
  alias: Alias,
  funcAliasMap: AliasMap,
  helper: AliasHelper
) {
  let bfsQueue = new Array<Styx.FlowNode>();
  let visited = new Set<Styx.FlowNode>();

  bfsQueue.push(alias.edge.source);
  while (bfsQueue.length) {
    let currentNode = bfsQueue.shift();
    if (!visited.has(currentNode)) {
      visited.add(currentNode);
      // search for alias
      for (let outgoingEdge of currentNode.outgoingEdges) {
        if (outgoingEdge.type === Styx.EdgeType.Epsilon) continue;
        if (outgoingEdge.data.type === ESTree.NodeType.AssignmentExpression) {
          let assignmentExpr = outgoingEdge.data as ESTree.AssignmentExpression;
          let RHSExpr = assignmentExpr.right;
          let isFunctionCall = false;
          if (RHSExpr.type === ESTree.NodeType.CallExpression) {
            // if a match is found at a function call, we add the callee instead of the LHS to aliasDict.
            isFunctionCall = true;
            RHSExpr = (RHSExpr as ESTree.CallExpression).callee;
          }
          if (stringify(RHSExpr) === stringify(alias.data)) {
            // exact match
            let stackCopy = copyPropertyStack(alias.propertyStack);
            /*
            console.log("At edge", outgoingEdge.label);
            console.log(
              "  -",
              stringify(RHSExpr),
              "EXACTLY MATCH",
              stringify(alias.data)
            );
            console.log("  - stackCopy", stackCopy);
            */
            if (!stackCopy.length) {
              // property stack empty, we have found an alias
              funcAliasMap.addAliasNamePair(
                isFunctionCall
                  ? stringify(RHSExpr)
                  : stringify(assignmentExpr.left),
                alias.originalTargetName
              );
            }
            if (assignmentExpr.left.type === ESTree.NodeType.Identifier) {
              // LHS is an identifier
              let currentAlias = new Alias(
                assignmentExpr.left as ESTree.Identifier,
                outgoingEdge,
                alias.originalTargetName,
                alias.func,
                stackCopy
              );
              if (!helper.done.includes(currentAlias.uniqueName)) {
                helper.worklist.push(currentAlias);
              }
            } else if (
              assignmentExpr.left.type === ESTree.NodeType.MemberExpression
            ) {
              // LHS is a member
              let currentAlias = new Alias(
                assignmentExpr.left as ESTree.MemberExpression,
                outgoingEdge,
                alias.originalTargetName,
                alias.func,
                stackCopy
              );
              if (!helper.done.includes(currentAlias.uniqueName)) {
                helper.worklist.push(currentAlias);
              }
            }
          } else if (
            checkForwardInclusion(stringify(RHSExpr), stringify(alias.data))
          ) {
            // RHS includes TGT
            let stackCopy = copyPropertyStack(alias.propertyStack);
            /*
            console.log("At edge", outgoingEdge.label);
            console.log(
              "  -",
              stringify(RHSExpr),
              "INCLUDES",
              stringify(alias.data)
            );
            console.log("  - stackCopy", stackCopy);
            */
            if (stackCopy.length) {
              // stack non-empty, so we match elements in stack
              let remainderList = splitStringIntoIdentifiers(
                stringify(RHSExpr).replace(stringify(alias.data) + '.', '')
              );
              let isPartialMatch = false;
              while (matchProperty(remainderList, stackCopy)) {
                isPartialMatch = true;
              }
              // A match is found, so we continue search the new LHS
              if (isPartialMatch && !stackCopy.length) {
                // all properties matched, we've found an alias
                funcAliasMap.addAliasNamePair(
                  isFunctionCall
                    ? stringify(RHSExpr)
                    : stringify(assignmentExpr.left),
                  alias.originalTargetName
                );
              }
              if (assignmentExpr.left.type === ESTree.NodeType.Identifier) {
                let currentAlias = new Alias(
                  assignmentExpr.left as ESTree.Identifier,
                  outgoingEdge,
                  alias.originalTargetName,
                  alias.func,
                  stackCopy
                );
                if (!helper.done.includes(currentAlias.uniqueName)) {
                  helper.worklist.push(currentAlias);
                }
              } else if (
                assignmentExpr.left.type === ESTree.NodeType.MemberExpression
              ) {
                let currentAlias = new Alias(
                  assignmentExpr.right as ESTree.MemberExpression,
                  outgoingEdge,
                  alias.originalTargetName,
                  alias.func,
                  stackCopy
                );
                if (!helper.done.includes(currentAlias.uniqueName)) {
                  helper.worklist.push(currentAlias);
                }
              }
            }
          } else if (
            checkForwardInclusion(stringify(alias.data), stringify(RHSExpr))
          ) {
            // TGT includes RHS
            /*
            console.log("At edge", outgoingEdge.label);
            console.log(
              "  - ",
              stringify(alias.data),
              "INCLUDES",
              stringify(RHSExpr)
            );
            */
            let stackCopy = copyPropertyStack(alias.propertyStack);
            let remainder = stringify(alias.data).replace(
              stringify(assignmentExpr.right),
              ''
            );
            if (remainder !== '') {
              let remainingIdentifiers = splitStringIntoIdentifiers(remainder);
              for (let id of remainingIdentifiers) {
                stackCopy.push(id);
              }
              // console.log("  - Property stack", stackCopy);
              if (assignmentExpr.left.type === ESTree.NodeType.Identifier) {
                let currentAlias = new Alias(
                  assignmentExpr.left as ESTree.Identifier,
                  outgoingEdge,
                  alias.originalTargetName,
                  alias.func,
                  stackCopy
                );
                if (!helper.done.includes(currentAlias.uniqueName)) {
                  helper.worklist.push(currentAlias);
                }
              } else if (
                assignmentExpr.left.type === ESTree.NodeType.MemberExpression
              ) {
                let currentAlias = new Alias(
                  assignmentExpr.right as ESTree.MemberExpression,
                  outgoingEdge,
                  alias.originalTargetName,
                  alias.func,
                  stackCopy
                );
                if (!helper.done.includes(currentAlias.uniqueName)) {
                  helper.worklist.push(currentAlias);
                }
              }
            }
          }
        }
        bfsQueue.push(outgoingEdge.target);
      }
      // const enclosedFuncNames = alias.func.enclosedFuncs;
      // EnclosedFuncsAliasSearch(alias, funcAliasMap, helper, enclosedFuncNames);
    }
  }
}

function EnclosedFuncsAliasSearch(
  alias: Alias,
  funcAliasMap: AliasMap,
  helper: AliasHelper,
  enclosedFuncNames: Array<string>
) {
  for (const enclosedFuncName of enclosedFuncNames) {
    const enclosedFunc = helper.funcs.get(enclosedFuncName);
    for (const edge of enclosedFunc.flowGraph.edges) {
      if (ESTree.isAssignmentExpression(edge.data)) {
        const assignmentExpr = edge.data;
        let RHSExpr = assignmentExpr.right;
        let isFunctionCall = false;

        if (RHSExpr.type === ESTree.NodeType.CallExpression) {
          isFunctionCall = true;
          RHSExpr = (RHSExpr as ESTree.CallExpression).callee;
        }

        if (stringify(RHSExpr) === stringify(alias.data)) {
          // exact match
          let stackCopy = copyPropertyStack(alias.propertyStack);
          if (!stackCopy.length) {
            // property stack empty, we have found an alias
            funcAliasMap.addAliasNamePair(
              isFunctionCall
                ? stringify(RHSExpr)
                : stringify(assignmentExpr.left),
              alias.originalTargetName
            );
          }
          if (assignmentExpr.left.type === ESTree.NodeType.Identifier) {
            // LHS is an identifier
            let currentAlias = new Alias(
              assignmentExpr.left as ESTree.Identifier,
              edge,
              alias.originalTargetName,
              enclosedFunc,
              stackCopy
            );
            if (!helper.done.includes(currentAlias.uniqueName)) {
              helper.worklist.push(currentAlias);
            }
          } else if (
            assignmentExpr.left.type === ESTree.NodeType.MemberExpression
          ) {
            // LHS is a member
            let currentAlias = new Alias(
              assignmentExpr.left as ESTree.MemberExpression,
              edge,
              alias.originalTargetName,
              enclosedFunc,
              stackCopy
            );
            if (!helper.done.includes(currentAlias.uniqueName)) {
              helper.worklist.push(currentAlias);
            }
          }
        } else if (
          checkForwardInclusion(stringify(RHSExpr), stringify(alias.data))
        ) {
          // RHS includes TGT
          let stackCopy = copyPropertyStack(alias.propertyStack);
          if (stackCopy.length) {
            // stack non-empty, so we match elements in stack
            let remainderList = splitStringIntoIdentifiers(
              stringify(RHSExpr).replace(stringify(alias.data) + '.', '')
            );
            let isPartialMatch = false;
            while (matchProperty(remainderList, stackCopy)) {
              isPartialMatch = true;
            }
            // A match is found, so we continue search the new LHS
            if (isPartialMatch && !stackCopy.length) {
              // all properties matched, we've found an alias
              funcAliasMap.addAliasNamePair(
                isFunctionCall
                  ? stringify(RHSExpr)
                  : stringify(assignmentExpr.left),
                alias.originalTargetName
              );
            }
            if (assignmentExpr.left.type === ESTree.NodeType.Identifier) {
              let currentAlias = new Alias(
                assignmentExpr.left as ESTree.Identifier,
                edge,
                alias.originalTargetName,
                enclosedFunc,
                stackCopy
              );
              if (!helper.done.includes(currentAlias.uniqueName)) {
                helper.worklist.push(currentAlias);
              }
            } else if (
              assignmentExpr.left.type === ESTree.NodeType.MemberExpression
            ) {
              let currentAlias = new Alias(
                assignmentExpr.right as ESTree.MemberExpression,
                edge,
                alias.originalTargetName,
                enclosedFunc,
                stackCopy
              );
              if (!helper.done.includes(currentAlias.uniqueName)) {
                helper.worklist.push(currentAlias);
              }
            }
          }
        } else if (
          checkForwardInclusion(stringify(alias.data), stringify(RHSExpr))
        ) {
          // TGT includes RHS
          let stackCopy = copyPropertyStack(alias.propertyStack);
          let remainder = stringify(alias.data).replace(
            stringify(assignmentExpr.right),
            ''
          );
          if (remainder !== '') {
            let remainingIdentifiers = splitStringIntoIdentifiers(remainder);
            for (let id of remainingIdentifiers) {
              stackCopy.push(id);
            }
            // console.log("  - Property stack", stackCopy);
            if (assignmentExpr.left.type === ESTree.NodeType.Identifier) {
              let currentAlias = new Alias(
                assignmentExpr.left as ESTree.Identifier,
                edge,
                alias.originalTargetName,
                enclosedFunc,
                stackCopy
              );
              if (!helper.done.includes(currentAlias.uniqueName)) {
                helper.worklist.push(currentAlias);
              }
            } else if (
              assignmentExpr.left.type === ESTree.NodeType.MemberExpression
            ) {
              let currentAlias = new Alias(
                assignmentExpr.right as ESTree.MemberExpression,
                edge,
                alias.originalTargetName,
                enclosedFunc,
                stackCopy
              );
              if (!helper.done.includes(currentAlias.uniqueName)) {
                helper.worklist.push(currentAlias);
              }
            }
          }
        }
      }
    }
    // const enclosedFuncOfEnclosedFunc = enclosedFunc.enclosedFuncs;
    // EnclosedFuncsAliasSearch(
    //   alias,
    //   funcAliasMap,
    //   helper,
    //   enclosedFuncOfEnclosedFunc
    // );
  }
}
