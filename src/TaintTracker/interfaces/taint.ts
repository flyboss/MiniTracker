import * as Styx from '../AFGGenerator/generator';
import * as ESTree from '../AFGGenerator/estree';
import { stringify } from '../AFGGenerator/parser/expressions/stringifier';
import { logger } from '../../utils/logHelper';

export enum TaintType {
  normal,
  call,
  implicit,
  global,
  closure,
  utilLib,
  utilSink,
}

export class Taint {
  data: ESTree.Identifier | ESTree.MemberExpression | ESTree.Literal;
  name: string;
  uniqueName: string;
  type: TaintType;
  controlFlowSourceNode: Styx.FlowNode;
  controlFlowEdge: Styx.FlowEdge;
  currentFunction: Styx.FlowFunction;
  propertyStack: Array<ESTree.Identifier>;
  nextTaints: Array<Taint>;
  endsAtSource: boolean;

  constructor(
    data: ESTree.Identifier | ESTree.MemberExpression | ESTree.Literal,
    type: TaintType,
    controlFlowSourceNode: Styx.FlowNode,
    controlFlowEdge: Styx.FlowEdge,
    currentFunction: Styx.FlowFunction,
    propertyStack: Array<ESTree.Identifier>
  ) {
    this.data = data;
    this.name = stringify(data);
    this.type = type;
    this.controlFlowSourceNode = controlFlowSourceNode;
    this.controlFlowEdge = controlFlowEdge;
    this.currentFunction = currentFunction;
    this.propertyStack = propertyStack;
    this.uniqueName = this.generateFiniteUniqueName();
    this.nextTaints = new Array<Taint>();
    this.endsAtSource = false;
    // logger.debug(
    //   `New taint ${this.name} created, at ${this.controlFlowEdge.label} in ${this.currentFunction.name}.`
    // );
    // logger.debug(`Property Stack`);
    // this.propertyStack.forEach((p) => logger.debug(`  - ${p.name}`));
  }

  private generateFiniteUniqueName() {
    let length = this.propertyStack.length > 3 ? 3 : this.propertyStack.length;
    let postFix = '';
    // for (let i = 0; i < length; ++i) {
    //   postFix = postFix + this.propertyStack[length - 1 - i].name + '.';
    // }

    return (
      this.name + '__@' + this.controlFlowSourceNode.id.toString() + postFix
    );
  }

  public stringifyPropertyStackAsMemberExpression(): string {
    if (!this.propertyStack.length) {
      return '';
    } else {
      let firstProp = this.propertyStack.pop();
      let propStackStr = firstProp.name;
      for (let p of Array.from(this.propertyStack).reverse()) {
        propStackStr = propStackStr + '.' + p.name;
      }
      this.propertyStack.push(firstProp);

      logger.debug(propStackStr);
      return propStackStr;
    }
  }

  public toString() {
    return this.name;
  }
}

export class TaintFlow {
  source: Taint;
  target: Taint;
  funcName: string;
  label: string;

  constructor(
    source: Taint | null,
    target: Taint,
    funcName: string,
    label: string
  ) {
    this.source = source;
    this.target = target;
    this.funcName = funcName;
    this.label = label;
  }
}

export class TaintedAssignment {
  edge: Styx.FlowEdge;
  propertyStack: Array<ESTree.Identifier>;
  currentFunction: Styx.FlowFunction;

  constructor(
    edge: Styx.FlowEdge,
    propertyStack: Array<ESTree.Identifier>,
    currentFunction
  ) {
    this.edge = edge;
    this.propertyStack = propertyStack;
    this.currentFunction = currentFunction;
  }
}
