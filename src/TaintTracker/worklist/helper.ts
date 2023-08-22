import { Taint, TaintFlow } from '../interfaces/taint';
import { Config } from '../../utils/config';
import { checkBackwardInclusion } from '../util/stringManip';
import { getSourceAndSink } from '../util/sourceAndSinkHelper';
import { TrackingManager } from '../../miniTracker';
import * as ESTree from '../AFGGenerator/estree';
import { logger } from '../../utils/logHelper';
import * as Flow from "../AFGGenerator/flow";
import {FlowEdge, FlowFunction} from "../AFGGenerator/flow";

export class Helper {
  worklist: Array<Taint>;
  done: Map<string, Taint>;
  dep: Array<TaintFlow>;
  manager: TrackingManager;
  sourceFunctions: Array<string>;
  sourceIdentifiers: Array<string>;
  sinkFunctions: Array<string>;
  noStrictSinks: Array<string>;
  callQueue: CallQueue;

  constructor() {
    this.worklist = new Array<Taint>();
    this.done = new Map<string, Taint>();
    this.dep = new Array<TaintFlow>();
    ({
      sourceFunctions: this.sourceFunctions,
      sinkFunctions: this.sinkFunctions,
      sourceIdentifiers: this.sourceIdentifiers,
    } = getSourceAndSink());
    this.noStrictSinks = new Array<string>();
    for (let sink of this.sinkFunctions) {
      this.noStrictSinks.push(sink.replace(Config['api_prefix'], ''));
    }
    this.callQueue = new CallQueue();
  }

  public mergeTaint(newTaint: Taint) {
    let nextTaints = new Array<Taint>();
    let exists = new Set<string>();

    // merge next taints
    // Note: In this implementation we removed duplicated taints, is this a must?
    let oldTaint = this.done.get(newTaint.uniqueName);
    for (let o of oldTaint.nextTaints) {
      if (!exists.has(o.uniqueName)) {
        exists.add(o.uniqueName);
        nextTaints.push(o);
      }
    }
    for (let n of newTaint.nextTaints) {
      if (!exists.has(n.uniqueName)) {
        exists.add(n.uniqueName);
        nextTaints.push(n);
      }
    }

    // update taint
    oldTaint.nextTaints = nextTaints;
    newTaint.nextTaints = nextTaints;

    this.done.set(oldTaint.uniqueName, oldTaint);

    return nextTaints;
  }
}

class CallQueue {
  callQueue: Array<FuncCallAndAssignment>;

  constructor() {
    this.callQueue = new Array<FuncCallAndAssignment>();
  }

  push(funcName: string, edge:FlowEdge,func:FlowFunction): void {
    this.callQueue.push(new FuncCallAndAssignment(funcName, edge, func));
  }

  pop(funcName: string): FuncCallAndAssignment {
    for (let i = 0; i < this.callQueue.length; i++) {
      if (funcName === this.callQueue[i].funcName) {
        if (i !== 0) {
          logger.info('the call queue remove a non-first call');
        }
        return this.callQueue.splice(i, 1)[0];
      }
    }
  }

  exist(funcName: string): boolean {
    for (const item of this.callQueue) {
      if (item.funcName === funcName) {
        return true;
      }
    }
    return false;
  }
}

export class FuncCallAndAssignment {
  funcName: string;
  edge:FlowEdge;
  func:FlowFunction;

  constructor(funcName: string, edge:FlowEdge,func:FlowFunction) {
    this.funcName = funcName;
    this.edge = edge;
    this.func = func;
  }
}
