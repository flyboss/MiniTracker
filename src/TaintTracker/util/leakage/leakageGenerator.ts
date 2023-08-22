import { Taint, TaintType } from '../../interfaces/taint';
import {
  CompactLeakageInfo,
  DataLeakage,
  GlobalDataLeakage,
  GlobalDataLeakageCompact,
  GlobalDataLeakageType,
} from './interface';
import { mapReplacer } from '../../../utils/util';
import { saveDataToFile } from '../../../utils/fileHelper';
import { isAssignmentExpression, isCallExpression } from '../../AFGGenerator/estree';

export function generateDataFlow(start: Taint): DataLeakage[] {
  const dfsManager = new Set<string>();
  const leakages = new Array<DataLeakage>();
  const taintStack = new Array<Taint>();
  if (start.nextTaints.length) {
    taintDFS(start, taintStack, leakages, dfsManager);
  }
  return leakages;
}

function taintDFS(
  currentTaint: Taint,
  taintStack: Array<Taint>,
  leakages: Array<DataLeakage>,
  dfsManager: Set<string>
) {
  taintStack.push(currentTaint);
  dfsManager.add(currentTaint.uniqueName);
  if (currentTaint.nextTaints.length) {
    for (const next of currentTaint.nextTaints) {
      if (!dfsManager.has(next.uniqueName)) {
        taintDFS(next, taintStack, leakages, dfsManager);
      }
    }
  }
  if (currentTaint.endsAtSource) {
    leakages.push({
      source: currentTaint,
      chain: Array.from(taintStack).reverse(),
      sink: taintStack[0],
    });
  }
  taintStack.pop();
}

export function generateGlobalDataFlow(start: Taint): GlobalDataLeakage[] {
  const dfsManager = new Set<string>();
  const leakages = new Array<GlobalDataLeakage>();
  const taintStack = new Array<Taint>();
  if (start.nextTaints.length) {
    globalDataDFS(start, taintStack, leakages, dfsManager);
  }
  return leakages;
}

function globalDataDFS(
  currentTaint: Taint,
  taintStack: Array<Taint>,
  leakages: Array<GlobalDataLeakage>,
  dfsManager: Set<string>
) {
  dfsManager.add(currentTaint.uniqueName);
  taintStack.push(currentTaint);
  if (currentTaint.nextTaints.length) {
    for (const next of currentTaint.nextTaints) {
      if (!dfsManager.has(next.uniqueName)) {
        globalDataDFS(next, taintStack, leakages, dfsManager);
      }
    }
  }
  if (currentTaint.name.includes('globalData')) {
    if (
      !currentTaint.nextTaints.length ||
      (currentTaint.nextTaints[0].propertyStack.length &&
        isAssignmentExpression(taintStack[0].controlFlowEdge.data) &&
        isCallExpression(taintStack[0].controlFlowEdge.data.right))
    ) {
      leakages.push({
        source: currentTaint,
        chain: Array.from(taintStack).reverse(),
        sink: taintStack[0],
        type: GlobalDataLeakageType.startsFromSink,
      });
    }
  } else if (
    currentTaint.endsAtSource &&
    taintStack[0].type === TaintType.global
  ) {
    leakages.push({
      source: currentTaint,
      chain: Array.from(taintStack).reverse(),
      sink: taintStack[0],
      type: GlobalDataLeakageType.endsAtSource,
    });
  }
  taintStack.pop();
}

function mergeGlobalFlowTables(
  a: Map<string, Array<GlobalDataLeakageCompact>>,
  b: Map<string, Array<GlobalDataLeakageCompact>>
) {
  b.forEach((value, key) => {
    if (a.has(key)) {
      a.set(key, a.get(key).concat(value));
    } else {
      a.set(key, value);
    }
  });
}

export function convertToCompactGlobalFlowTable(
  flows: Array<GlobalDataLeakage>,
  page: string,
  dir: string,
  flowTable: Map<string, Array<GlobalDataLeakageCompact>>
) {
  const currentFlowTable: Map<
    string,
    Array<GlobalDataLeakageCompact>
  > = new Map();
  for (const flow of flows) {
    const chainArray = new Array<CompactLeakageInfo>();
    for (const chain of flow.chain) {
      chainArray.push({
        name: chain.name,
        edge: chain.controlFlowEdge.label,
        function: chain.currentFunction.name,
      });
    }
    const source: CompactLeakageInfo = {
      name: flow.source.name,
      edge: flow.source.controlFlowEdge.label,
      function: flow.source.currentFunction.name,
    };
    const sink: CompactLeakageInfo = {
      name: flow.sink.name,
      edge: flow.sink.controlFlowEdge.label,
      function: flow.sink.currentFunction.name,
    };
    if (!currentFlowTable.has(flow.sink.name)) {
      currentFlowTable.set(
        flow.sink.name,
        new Array<GlobalDataLeakageCompact>()
      );
    }
    currentFlowTable.get(flow.sink.name).push({
      source: source,
      chain: chainArray,
      sink: sink,
      type: flow.type,
      page: page,
    });
  }
  saveDataToFile(
    dir + '-globalDataFlows' + '.json',
    JSON.stringify(currentFlowTable, mapReplacer)
  );
  mergeGlobalFlowTables(flowTable, currentFlowTable);
}
