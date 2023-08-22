import * as Styx from "../AFGGenerator/generator";
import * as ESTree from "../AFGGenerator/estree";
import { stringify } from "../AFGGenerator/parser/expressions/stringifier";
import { Taint, TaintFlow, TaintType } from "../interfaces/taint";
import {logger} from "../../utils/logHelper";

export { bfsTaintSearch, bfsAliasSearch };

function bfsAliasSearch(start: Styx.FlowEdge, target: string): Array<string> {
  // to be updated to set
  const numNodes = 1000;
  //

  let bfsQueue = new Array<Styx.FlowNode>();
  let visited = new Set<Styx.FlowNode>();
  let aliasList = new Array<string>();

  bfsQueue.push(start.source);
  aliasList.push(target);
  while (bfsQueue.length !== 0) {
    let currentNode = bfsQueue.shift();
    if (!visited.has(currentNode)) {
      visited.add(currentNode);
      // search for alias
      for (let outgoingEdge of currentNode.outgoingEdges) {
        if (outgoingEdge.data.type === ESTree.NodeType.AssignmentExpression) {
          let aliasAssignment = <ESTree.AssignmentExpression>outgoingEdge.data;
          if (stringify(aliasAssignment.right) === target) {
            // right-value is our target, so the left-value is an alias
            aliasList.push(stringify(aliasAssignment.left));
            // console.log('[Worklist] Added Alias:', stringify(aliasAssignment.left));
            aliasList = aliasList.concat(
              bfsAliasSearch(outgoingEdge, stringify(aliasAssignment.left))
            );
          }
        }
        bfsQueue.push(outgoingEdge.target);
      }
    }
  }

  return aliasList;
}

function bfsTaintSearch(start: Taint): Array<Styx.FlowEdge> {
  /**
   * A bfs-based algorithm
   * that searches for nearest assignments to a taint.
   * We search backward in the cfg,
   * starting from the taint.
   */

  // to be updated to set
  const numNodes = 1000;
  let bfsQueue = new Array<Styx.FlowNode>();
  let taintedEdges = new Array<Styx.FlowEdge>();
  let visited = new Set<Styx.FlowNode>();

  bfsQueue.push(start.controlFlowSourceNode);
  while (bfsQueue.length !== 0) {
    let currentNode = bfsQueue.shift();
    if (!visited.has(currentNode)) {
      visited.add(currentNode);
      // follow the incoming edge to search backward in cfg
      for (let incomingEdge of currentNode.incomingEdges) {
        if (incomingEdge.data.type === ESTree.NodeType.AssignmentExpression) {
          let assignmentExpr = <ESTree.AssignmentExpression>incomingEdge.data;
          if (stringify(assignmentExpr.left) === start.name) {
            // if we find an assignment to the tainted Id,
            // then we are done on this cfg path
            taintedEdges.push(incomingEdge);
            logger.debug("[Worklist] Added Edge:", incomingEdge.label);
            continue;
          } else if (stringify(assignmentExpr.left).includes(start.name)) {
            taintedEdges.push(incomingEdge);
            logger.debug("[Worklist] Added Edge:", incomingEdge.label);
          }
        }
        // otherwise we continue bfs on this path
        bfsQueue.push(incomingEdge.source);
      }
    }
  }

  return taintedEdges;
}
