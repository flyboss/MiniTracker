import { TrackingManager } from '../../../miniTracker';
import { logger } from '../../../utils/logHelper';
import { TaintType } from '../../interfaces/taint';
import { AliasMap } from '../../functionAliasSearch/functionAliasMap';
import { getCalleeString } from '../stringManip';
import {
  AppAnalysisResult,
  DataLeakage,
  GlobalDataLeakageCompact,
  GlobalDataLeakageType,
  PageAnalysisResult,
} from './interface';
import {
  createLeakageAnalyzer,
  printLeakageAnalyse,
  markdownLeakageFormatter,
  updateExisingGlobalSourcesAndSinks,
  updateExisingLocalSourcesAndSinks,
  updateSourceAndSinkCounter,
} from './leakageAnalyzer';

function printPageLocalLeakages(
  localDataLeak: DataLeakage,
  funcAliasMap: AliasMap,
  manager?: TrackingManager
) {
  const source = localDataLeak.chain[0];
  const sink = localDataLeak.chain[localDataLeak.chain.length - 1];

  if (source.type == TaintType.utilLib) {
    return
  }

  let finalSourceName: string;
  let finalSinkName: string;

  let sourceName = funcAliasMap.getNameByAlias(source.name);
  if (sourceName === '') {
    sourceName = source.name;
  }

  if (manager?.moduleAnalysis.utilNameToAPIName.has(sourceName)) {
    const actualSourceName = manager.getActualName(sourceName);
    logger.info(
      `  - Source     : ${sourceName} (alias of ${source.name}, has data from ${actualSourceName})`
    );
    finalSourceName = actualSourceName;
  } else {
    logger.info(`  - Source     : ${source.name} (alias of ${source.name})`);
    finalSourceName = source.name;
  }
  logger.info(
    `                 At edge ${source.controlFlowEdge.label} in ${source.currentFunction.name}`
  );

  for (let i = 1; i < localDataLeak.chain.length; ++i) {
    const from = localDataLeak.chain[i - 1];
    const to = localDataLeak.chain[i];
    logger.info(`  - Propagation: ${from.name} --> ${to.name}`);
    logger.info(
      `                 At edge ${from.controlFlowEdge.label} in ${from.currentFunction.name}`
    );
  }

  const sinkLabel = sink.controlFlowEdge.label;
  const sinkAlias = getCalleeString(sinkLabel);
  let sinkApiName = funcAliasMap.getNameByAlias(sinkAlias);
  if (sinkApiName === '') {
    sinkApiName = sinkAlias;
  }
  if (manager?.moduleAnalysis.utilNameToAPIName.has(sinkApiName)) {
    const actualSinkName = manager.getActualName(sinkApiName);
    logger.info(
      `  - Sink       : ${sinkApiName} (alias of ${sinkAlias}, sends data to ${actualSinkName})`
    );
    finalSinkName = actualSinkName;
  } else {
    logger.info(`  - Sink       : ${sinkApiName} (alias of ${sinkAlias})`);
    finalSinkName = sinkApiName;
  }
  logger.info(
    `                 At ${sinkLabel} in ${sink.currentFunction.name}`
  );
  updateSourceAndSinkCounter(finalSourceName, finalSinkName);
  updateExisingLocalSourcesAndSinks(sourceName, sinkApiName);
}

export function singlePageOutput(
  result: PageAnalysisResult,
  manager?: TrackingManager
) {
  if (!result.localDataLeaks) {
    logger.info(
      `Result of ${result.page.name} is null. Probably due to an empty js.`
    );
    return;
  }
  if (!result.localDataLeaks.length) {
    logger.info(`No data leak found in ${result.page.name}`);
  }
  for (const localLeak of result.localDataLeaks) {
    logger.info(`Potential data leak in ${result.page.name}.`);
    printPageLocalLeakages(localLeak, result.page.funcAliasMap, manager);
  }

  if (!result.page.isComponent) {
    for (const componentResult of result.componentAnalysisResult) {
      singlePageOutput(componentResult, manager);
    }
  }
}

export function multiPageOutput(
  results: AppAnalysisResult,
  manager: TrackingManager
) {
  // createLeakageAnalyzer();
  for (const pageResult of results.pageResults) {
    singlePageOutput(pageResult, manager);
  }
  linkGlobalFlowsCompact(results.flowTable, manager);
  printLeakageAnalyse();
  markdownLeakageFormatter(manager);
}

function linkGlobalFlowsCompact(
  flowTable: Map<string, Array<GlobalDataLeakageCompact>>,
  manager: TrackingManager
) {
  flowTable.forEach((flows) => {
    flows.forEach((sinkFlow) => {
      if (sinkFlow.type === GlobalDataLeakageType.startsFromSink) {
        if (flowTable.has(sinkFlow.source.name)) {
          flowTable.get(sinkFlow.source.name).forEach((sourceFlow) => {
            if (sourceFlow.type === GlobalDataLeakageType.endsAtSource) {
              printGlobalDataLeakages(sinkFlow, sourceFlow, manager);
            }
          });
        }
      }
    });
  });
}

function printGlobalDataLeakages(
  sink: GlobalDataLeakageCompact,
  source: GlobalDataLeakageCompact,
  manager: TrackingManager
) {
  let finalSourceName: string;
  let finalSinkName: string;

  logger.info('[WorklistOutput] Potential leakage in global data.');
  logger.info(`  ## In page ${source.page} ##`);
  if (manager.moduleAnalysis.utilNameToAPIName.has(source.source.name)) {
    const actualSourceName = manager.getActualName(source.source.name);
    logger.info(
      `  - Source     : ${source.source.name} (has data from ${actualSourceName})`
    );
    finalSourceName = actualSourceName;
  } else {
    logger.info(`  - Source     : ${source.source.name}`);
    finalSourceName = source.source.name;
  }
  logger.info(
    `                 At edge ${source.source.edge} in ${source.source.function}`
  );

  for (let i = 1; i < source.chain.length; ++i) {
    const from = source.chain[i - 1];
    const to = source.chain[i];
    logger.info(`  - Propagation: ${from.name} --> ${to.name}`);
    logger.info(`                 At edge ${from.edge} in ${from.function}`);
  }
  logger.info(`  - Global Data: ${source.sink.name}`);
  logger.info(`  ## In page ${sink.page} ##`);
  logger.info(`  - Global Data: ${sink.source.name}`);
  for (let i = 1; i < sink.chain.length; ++i) {
    const from = sink.chain[i - 1];
    const to = sink.chain[i];
    logger.info(`  - Propagation: ${from.name} --> ${to.name}`);
    logger.info(`                 At edge ${from.edge} in ${from.function}`);
  }

  const sinkLabel = sink.sink.edge;
  const sinkApiName = getCalleeString(sinkLabel);
  if (manager.moduleAnalysis.utilNameToAPIName.has(sinkApiName)) {
    const actualSinkName = manager.getActualName(sinkApiName);
    logger.info(
      `  - Sink       : ${sinkApiName} (sends data to ${actualSinkName})`
    );
    finalSinkName = actualSinkName;
  } else {
    logger.info(`  - Sink       : ${sinkApiName}`);
    finalSinkName = sinkApiName;
  }
  logger.info(`                 At ${sinkLabel} in ${sink.sink.function}`);

  updateSourceAndSinkCounter(finalSourceName, finalSinkName);
  updateExisingGlobalSourcesAndSinks(source.source.name, sinkApiName);
}
