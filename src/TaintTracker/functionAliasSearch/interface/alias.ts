import * as Styx from '../../AFGGenerator/generator';
import * as ESTree from '../../AFGGenerator/estree';
import { stringify } from '../../AFGGenerator/parser/expressions/stringifier';

export class Alias {
  data: ESTree.Identifier | ESTree.MemberExpression;
  edge: Styx.FlowEdge;
  originalTargetName: string;
  uniqueName: string;
  func: Styx.FlowFunction;
  propertyStack: Array<ESTree.Identifier>;

  constructor(
    data: ESTree.Identifier | ESTree.MemberExpression,
    edge: Styx.FlowEdge,
    originalTargetName: string,
    func: Styx.FlowFunction,
    propertyStack: Array<ESTree.Identifier>
  ) {
    this.data = data;
    this.edge = edge;
    this.originalTargetName = originalTargetName;
    this.func = func;
    this.propertyStack = propertyStack;
    this.uniqueName = stringify(this.data) + '__@' + edge.source.id.toString();
  }
}

export class AliasHelper {
  worklist: Array<Alias>;
  done: Array<string>;
  funcs: Map<string, Styx.FlowFunction>;

  constructor() {
    this.worklist = new Array<Alias>();
    this.done = new Array<string>();
    this.funcs = new Map();
  }
}
