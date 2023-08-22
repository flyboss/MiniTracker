import * as ESTree from '../AFGGenerator/estree';
import * as Styx from '../AFGGenerator/generator';
import {
  AliasMap,
  BFSAliasSearch,
} from '../functionAliasSearch/functionAliasMap';
import { createExtraPassContext, ExtraPassContext } from './extraPassContext';
import { appendCallExprTo } from './flowGraphModifier';
import { stringify } from '../AFGGenerator/parser/expressions/stringifier';
import { saveFunc } from '../util/frontEnd';
import { logger } from '../../utils/logHelper';
import { Alias, AliasHelper } from '../functionAliasSearch/interface/alias';

function isMember(member: string, obj: string): boolean {
  if (member.length < obj.length) {
    return false;
  }
  const members = member.split('.');
  return obj === members[0];
}

export function extraPasses(
  cfg: Styx.FlowProgram,
  funcAliasMap: AliasMap,
  filepath: string
  // perhaps we can pass functions as callbacks? like babel?
) {
  const done = new Array<Styx.FlowEdge>();
  const context: ExtraPassContext = createExtraPassContext();
  // const aliasHelper = new AliasHelper();
  // const enclosingObjects = new Array<string>();
  // for (const func of cfg.functions) {
  //   for (const edge of func.flowGraph.edges) {
  //     if (edge.type === Styx.EdgeType.Epsilon) continue;
  //     if (edge.type === Styx.EdgeType.Normal) {
  //       if (ESTree.isAssignmentExpression(edge.data)) {
  //         if (
  //           // Note: we assume that the LHS is also an identifier,
  //           // in most cases this assumption should hold true.
  //           ESTree.isIdentifier(edge.data.left) &&
  //           ESTree.isIdentifier(edge.data.right, { name: 'this' })
  //         ) {
  //           logger.debug(`RHS is 'this' at ${edge.label} in ${func.name}`);
  //           const aliases = funcAliasMap.getAllAliases(func.name);
  //           for (const alias of aliases) {
  //             if (alias.includes('.')) {
  //               const enclosingObj = alias.split('.')[0];
  //               logger.debug(`Enclosing Obj ${enclosingObj}`);
  //               enclosingObjects.push(enclosingObj);
  //               aliasHelper.worklist.push(
  //                 new Alias(edge.data.left, edge, enclosingObj, [])
  //               );
  //               logger.debug(`Added LHS ${edge.data.left.name}`);
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // }
  // const objAliasMap = new AliasMap(enclosingObjects);
  // while (aliasHelper.worklist.length) {
  //   let current = aliasHelper.worklist.shift();
  //   aliasHelper.done.push(current.uniqueName);
  //   BFSAliasSearch(current, objAliasMap, aliasHelper);
  // }

  // for (const obj of enclosingObjects) {
  //   logger.debug(`Obj: ${obj} -> ${objAliasMap.getAllAliases(obj)}`);
  // }

  for (const func of cfg.functions) {
    for (const edge of func.flowGraph.edges) {
      if (edge.type === Styx.EdgeType.Epsilon) continue;
      if (edge.type === Styx.EdgeType.Normal) {
        if (edge.data.type === ESTree.NodeType.AssignmentExpression) {
          const assignmentExpr = edge.data as ESTree.AssignmentExpression;
          if (
            assignmentExpr.right.type === ESTree.NodeType.CallExpression ||
            assignmentExpr.right.type === ESTree.NodeType.NewExpression
          ) {
            const callExpr = assignmentExpr.right as ESTree.CallExpression;
            const calleeExpr = callExpr.callee;
            const calleeExprStr = stringify(calleeExpr);
            // TODO 这里应该不用判断吧？
            // if (funcAliasMap.getFunctionInfo(calleeExprStr) !== null) {
            if (!done.includes(edge)) {
              done.push(edge);
              const LHSIdentifier = assignmentExpr.left as ESTree.Identifier;
              for (const argument of callExpr.arguments) {
                let argstring = stringify(argument);
                if (
                  funcAliasMap.getFunctionInfo(argstring) !== null
                ) {
                  // argument is function
                  appendCallExprTo(
                    edge,
                    funcAliasMap.getFunctionInfo(argstring),
                    context,
                    func,
                    null,
                    [LHSIdentifier]
                  );
                } else if (argstring !== 'wx' && argstring !== 'swan' && argstring !== '__PageParameter__') {
                  // argument's attributes are functions
                  for (const alias in funcAliasMap.aliasToName) {
                    if (isMember(alias, argstring)) {
                      appendCallExprTo(
                        edge,
                        funcAliasMap.getFunctionInfo(alias),
                        context,
                        func,
                        null,
                        [LHSIdentifier]
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  saveFunc(filepath.replace('.js', ''), cfg.functions, 'modcfg', '-extraPass');
}
