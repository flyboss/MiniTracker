import * as ESTree from '../AFGGenerator/estree';
import {
  createAssignmentExpression,
  createCallExpression,
  createIdentifier,
  createReturnStatement,
} from '../AFGGenerator/estreeFactory';
import * as Styx from '../AFGGenerator/generator';
import { stringify } from '../AFGGenerator/parser/expressions/stringifier';
import { ExtraPassContext } from './extraPassContext';
import { CompactFunctionInfo } from '../functionAliasSearch/functionAliasMap';

export function appendCallExprTo(
  currentEdge: Styx.FlowEdge,
  appendCallInfo: CompactFunctionInfo,
  context: ExtraPassContext,
  func: Styx.FlowFunction,
  leftHandSide?: ESTree.Identifier,
  parameters?: Array<ESTree.Identifier>
) {
  /**
   * Appends a call expression behind currentEdge.
   *
   * NOTE: A known bug exists. If you try to append a function call to an edge with the same function call,
   *       e.g. append call to foo() to all edges calling foo(),
   *       the function will never halt.
   *
   * @param {Styx.FlowEdge} currentEdge: edge to which a new edge will be appended.
   * @param {CompactFunctionInfo} appendCallInfo: the info of the new function call.
   *        Use aliasDict.getFunctionInfo() to find this information.
   * @param {ExtraPassContext} context: context for the second traverse over cfg.
   * @param {Styx.FlowFunction} func: the function where the edge is located.
   * @param {ESTree.Identifier} leftHandSide: Optional.
   *        The lhs to which the return value of the call is assigned.
   *        A temporary variable will be created if nothing is provided.
   * @param {ESTree.Identifier[]} parameters: Optional.
   *        The parameters passed to the new function call.
   *        No parameters will be added if nothing is provided.
   */
  const callExpr = createCallExpression(
    createIdentifier(appendCallInfo.name),
    parameters ?? appendCallInfo.parameters
  );
  const callAssignmentExpr = createAssignmentExpression({
    left: leftHandSide ?? context.createTempVarIdentifier(),
    right: callExpr,
  });
  const currentNode = appendNewEdgeTo(
    currentEdge,
    callAssignmentExpr,
    context,
    func
  );

  const returnExpr = createReturnStatement(callAssignmentExpr.left);
  const returnEdge = createNewEdge(
    currentNode,
    func.flowGraph.successExit,
    returnExpr,
    Styx.EdgeType.AbruptCompletion,
    'return ' + stringify(callAssignmentExpr.left)
  );
  func.flowGraph.edges.push(returnEdge);
}

function appendNewEdgeTo(
  currentEdge: Styx.FlowEdge,
  data: ESTree.Expression,
  context: ExtraPassContext,
  func: Styx.FlowFunction
): Styx.FlowNode {
  /**
   * Appends a new edge after currentEdge.
   *
   * @param {FlowEdge} currentEdge: the edge to which a new edge will be appended.
   * @param {ESTree.Expression} data: the data of the new edge.
   * @param {ExtraPassContext} context: parsing context.
   * @param {Styx.FlowFunction} func: the function where currentEdge is located.
   */
  const precedingNode = currentEdge.source;
  const succeedingNode = currentEdge.target;
  const relayNode = context.createNode();

  const newEdge = createNewEdge(relayNode, succeedingNode, data);

  currentEdge.source = precedingNode;
  currentEdge.target = relayNode;

  relayNode.incomingEdges.push(currentEdge);
  relayNode.outgoingEdges.push(newEdge);

  for (let i = 0; i < precedingNode.outgoingEdges.length; ++i) {
    if (precedingNode.outgoingEdges[i].label === currentEdge.label) {
      precedingNode.outgoingEdges[i] = currentEdge;
    }
  }
  for (let i = 0; i < succeedingNode.incomingEdges.length; ++i) {
    if (succeedingNode.incomingEdges[i].label === currentEdge.label) {
      succeedingNode.incomingEdges[i] = newEdge;
    }
  }

  func.flowGraph.edges.push(newEdge);
  func.flowGraph.nodes.push(relayNode);

  return succeedingNode;
}

function createNewEdge(
  source: Styx.FlowNode,
  target: Styx.FlowNode,
  data: ESTree.Expression,
  type = Styx.EdgeType.Normal,
  label?: string
): Styx.FlowEdge {
  return {
    source: source,
    target: target,
    type: type,
    label: label ? label : stringify(data),
    data: data,
  };
}
