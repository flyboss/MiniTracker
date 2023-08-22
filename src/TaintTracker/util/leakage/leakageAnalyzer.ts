import * as path from 'path';
import * as fs from 'fs';
import { mapReviver } from '../../../utils/util';
import { Config } from '../../../utils/config';
import { logger, markdownLogger } from '../../../utils/logHelper';
import {
  DataLeakage,
  GlobalDataLeakageCompact,
  GlobalDataLeakageType,
  PageAnalysisResult,
} from './interface';
import { TaintType } from '../../interfaces/taint';
import { getCalleeString } from '../stringManip';
import { AliasMap } from '../../functionAliasSearch/functionAliasMap';
import { TrackingManager } from '../../../miniTracker';

interface ApiCounter {
  apiOccurrence: number;
  apiInLeakage: number;
}

const sourceApiCounter = new Map<string, ApiCounter>();
const sinkApiCounter = new Map<string, ApiCounter>();
const localSources = new Map<string, ApiCounter>();
const localSinks = new Map<string, ApiCounter>();
const globalSources = new Map<string, ApiCounter>();
const globalSinks = new Map<string, ApiCounter>();

export function updateExisingLocalSourcesAndSinks(
  sourceAPI: string,
  sinkAPI: string
) {
  if (localSources.has(sourceAPI)) {
    localSources.get(sourceAPI).apiInLeakage++;
  } else {
    localSources.set(sourceAPI, { apiOccurrence: 0, apiInLeakage: 1 });
  }
  if (localSinks.has(sinkAPI)) {
    localSinks.get(sinkAPI).apiInLeakage++;
  } else {
    localSinks.set(sinkAPI, { apiOccurrence: 0, apiInLeakage: 1 });
  }
}

export function updateExisingGlobalSourcesAndSinks(
  sourceAPI: string,
  sinkAPI: string
) {
  if (globalSources.has(sourceAPI)) {
    globalSources.get(sourceAPI).apiInLeakage++;
  } else {
    globalSources.set(sourceAPI, { apiOccurrence: 0, apiInLeakage: 1 });
  }
  if (globalSinks.has(sinkAPI)) {
    globalSinks.get(sinkAPI).apiInLeakage++;
  } else {
    globalSinks.set(sinkAPI, { apiOccurrence: 0, apiInLeakage: 1 });
  }
}

function computeTotalNumOfLeakages() {
  let local = 0;
  let global = 0;
  for (const [key, apiCounter] of localSources.entries()) {
    local += apiCounter.apiInLeakage;
  }
  for (const [key, apiCounter] of globalSources.entries()) {
    global += apiCounter.apiInLeakage;
  }
  return { local: local, global: global };
}

export function createLeakageAnalyzer() {
  const baiduAppApiStatisticPath = path.join(
    __dirname,
    '../../../../statistic/BaiduAppApiStatistic.json'
  );
  const apps = JSON.parse(
    fs.readFileSync(baiduAppApiStatisticPath).toString(),
    mapReviver
  );
  for (const app of apps) {
    if (app['name'] === Config['original_app_path']) {
      app.sourceApi.forEach((value, key) => {
        sourceApiCounter.set(key, {
          apiOccurrence: value,
          apiInLeakage: 0,
        });
      });
      app.sinkApi.forEach((value, key) => {
        sinkApiCounter.set(key, {
          apiOccurrence: value,
          apiInLeakage: 0,
        });
      });
    }
  }
}

export function updateSourceAndSinkCounter(
  sourceApi: string,
  sinkApi: string
): void {
  if (sourceApiCounter.has(sourceApi)) {
    sourceApiCounter.get(sourceApi).apiInLeakage++;
  }
  if (sinkApiCounter.has(sinkApi)) {
    sinkApiCounter.get(sinkApi).apiInLeakage++;
  }
}

export function printLeakageAnalyse() {
  logger.info('\t - Source api');
  sourceApiCounter.forEach((apiCounter, apiName) => {
    logger.info(
      `${apiName}: appear ${apiCounter.apiOccurrence}, find ${apiCounter.apiInLeakage}`
    );
  });
  logger.info('\t - Sink api');
  sinkApiCounter.forEach((apiCounter, apiName) => {
    logger.info(
      `${apiName}: appear ${apiCounter.apiOccurrence}, find ${apiCounter.apiInLeakage}`
    );
  });
}

export function markdownLeakageFormatter(manager: TrackingManager) {
  /**
   * markdownLogger.info() printer with markdown formatting.
   */
  let { local: local, global: global } = computeTotalNumOfLeakages();
  markdownLogger.info('# Analysis Result\n');
  logger.info(`Total Leakages - Local: ${local}; Global: ${global}`);
  markdownLogger.info(
    `- Local leakages: ${local}; Global leakages: ${global}\n`
  );

  // markdownLogger.info('## Contents\n');
  // markdownLogger.info('- [Overview](#overview)');
  // markdownLogger.info(
  //   '- [Additional Sources and Sinks](#additional-source-and-sink-analysis)'
  // );
  // markdownLogger.info('- [Leakages](#leakage-analysis)');
  // markdownLogger.info('- [Util Lib Info](#util-lib-info)\n');

  markdownLogger.info('## Overview\n');
  formatAnalysisOverview(manager);

  markdownLogger.info('## Additional Source and Sink Analysis\n');
  formatAdditionalSourcesAndSinks(manager);

  markdownLogger.info();

  markdownLogger.info('## Leakage Analysis\n');
  manager.pageResults.forEach((result) => {
    formatPageResult(result, manager);
  });
  manager.moduleAnalysis.utilLocalFlows.forEach((result) => {
    formatPageResult(result, manager);
  });

  formatGlobalLeakages(manager);

  markdownLogger.info('## Util Lib Info\n');
  formatUtilLibInfo(manager);
}

function formatUtilLibInfo(manager: TrackingManager) {
  markdownLogger.info('### Util Library Info\n');
  markdownLogger.info(
    formatMarkdownTableHead(['UtilLib Name', 'UtilLib Path'])
  );
  manager.moduleAnalysis.utilLibToPath.forEach((p, libName) => {
    markdownLogger.info(
      formatMarkdownTableItem([
        `\`${libName}\``,
        path.relative(manager.rootdir, p),
      ])
    );
  });

  markdownLogger.info();
}

function formatAdditionalSourcesAndSinks(manager: TrackingManager) {
  markdownLogger.info('### Additional Source and Sink Functions\n');

  markdownLogger.info('#### Additional Sources\n');
  markdownLogger.info(
    formatMarkdownTableHead(['Encapsulating Function', 'Actual Source API'])
  );
  localSources.forEach((apiCounter, apiName) => {
    if (manager.moduleAnalysis.utilNameToAPIName.has(apiName)) {
      markdownLogger.info(
        formatMarkdownTableItem([
          `\`${apiName}\``,
          `\`${manager.getActualName(apiName)}\``,
        ])
      );
    }
  });

  markdownLogger.info();

  markdownLogger.info('#### Additional Sinks\n');
  markdownLogger.info(
    formatMarkdownTableHead(['Encapsulating Function', 'Actual Sink API'])
  );
  localSinks.forEach((apiCounter, apiName) => {
    if (manager.moduleAnalysis.utilNameToAPIName.has(apiName)) {
      markdownLogger.info(
        formatMarkdownTableItem([
          `\`${apiName}\``,
          `\`${manager.getActualName(apiName)}\``,
        ])
      );
    }
  });
}

function formatAnalysisOverview(manager: TrackingManager) {
  markdownLogger.info('### All Existing Local Sensitive API Calls\n');
  markdownLogger.info('- Sources');
  localSources.forEach((apiCounter, apiName) => {
    if (manager.moduleAnalysis.utilNameToAPIName.has(apiName)) {
      const actualName = manager.getActualName(apiName);
      markdownLogger.info(
        `  - \`${apiName}\` (\`${actualName}\`): ${apiCounter.apiInLeakage}`
      );
    } else {
      markdownLogger.info(`  - \`${apiName}\`: ${apiCounter.apiInLeakage}`);
    }
  });
  markdownLogger.info('- Sinks');
  localSinks.forEach((apiCounter, apiName) => {
    if (manager.moduleAnalysis.utilNameToAPIName.has(apiName)) {
      const actualName = manager.getActualName(apiName);
      markdownLogger.info(
        `  - \`${apiName}\` (\`${actualName}\`): ${apiCounter.apiInLeakage}`
      );
    } else {
      markdownLogger.info(`  - \`${apiName}\`: ${apiCounter.apiInLeakage}`);
    }
  });
  markdownLogger.info();

  markdownLogger.info('### All Existing Global Sensitive API Calls\n');
  markdownLogger.info('- Sources');
  globalSources.forEach((apiCounter, apiName) => {
    if (manager.moduleAnalysis.utilNameToAPIName.has(apiName)) {
      const actualName = manager.getActualName(apiName);
      markdownLogger.info(
        `  - \`${apiName}\` (\`${actualName}\`): \`${apiCounter.apiInLeakage}\``
      );
    } else {
      markdownLogger.info(`  - \`${apiName}\`: \`${apiCounter.apiInLeakage}\``);
    }
  });
  markdownLogger.info('- Sinks');
  globalSinks.forEach((apiCounter, apiName) => {
    if (manager.moduleAnalysis.utilNameToAPIName.has(apiName)) {
      const actualName = manager.getActualName(apiName);
      markdownLogger.info(
        `  - \`${apiName}\` (\`${actualName}\`): \`${apiCounter.apiInLeakage}\``
      );
    } else {
      markdownLogger.info(`  - ${apiName}: ${apiCounter.apiInLeakage}`);
    }
  });
  markdownLogger.info();

  // The following code is for checking analysis result
  // when coarse-grained API statistics are available
  // markdownLogger.info('#### Official API Calls');
  // markdownLogger.info();
  // markdownLogger.info('- Source api');
  // sourceApiCounter.forEach((apiCounter, apiName) => {
  //   if (manager.moduleAnalysis.utilNameToAPIName.has(apiName)) {
  //     const actualName = manager.getActualName(apiName);
  //     markdownLogger.info(
  //       `  - \`${apiName}\` (\`${actualName}\`): Existing: ${apiCounter.apiOccurrence}, Found: ${apiCounter.apiInLeakage}`
  //     );
  //   } else {
  //     markdownLogger.info(
  //       `  - \`${apiName}\`: Existing: ${apiCounter.apiOccurrence}, Found: ${apiCounter.apiInLeakage}`
  //     );
  //   }
  // });
  // markdownLogger.info('- Sink api');
  // sinkApiCounter.forEach((apiCounter, apiName) => {
  //   if (manager.moduleAnalysis.utilNameToAPIName.has(apiName)) {
  //     const actualName = manager.getActualName(apiName);
  //     markdownLogger.info(
  //       `  - \`${apiName}\` (\`${actualName}\`): Existing: ${apiCounter.apiOccurrence}, Found: ${apiCounter.apiInLeakage}`
  //     );
  //   } else {
  //     markdownLogger.info(
  //       `  - \`${apiName}\`: Existing: ${apiCounter.apiOccurrence}, Found: ${apiCounter.apiInLeakage}`
  //     );
  //   }
  // });
}

function formatMarkdownTableHead(items: Array<string>): string {
  let headerItems = formatMarkdownTableItem(items);
  let headerDelimiter: string = '|';
  for (let i = 0; i < items.length; ++i) {
    headerDelimiter += ' :----: |';
  }
  return headerItems + '\n' + headerDelimiter;
}

function formatMarkdownTableItem(items: Array<string>) {
  let tableRow = '|';
  for (let item of items) {
    tableRow += ` ${item} |`;
  }
  return tableRow;
}

function formatPageResult(
  pageResult: PageAnalysisResult,
  manager: TrackingManager
) {
  let leakageId = 1;
  if (!pageResult.localDataLeaks) {
    return;
  }
  if (!pageResult.localDataLeaks.length) {
    return;
  }
  markdownLogger.info(
    `### Page ${path.relative(manager.rootdir, pageResult.page.filepath)}\n`
  );

  pageResult.localDataLeaks.forEach((dataLeakage) => {
    formatLeakage(
      dataLeakage,
      manager,
      pageResult.page.funcAliasMap,
      leakageId
    );
    leakageId++;
  });
  if (!pageResult.page.isComponent) {
    for (const componentResult of pageResult.componentAnalysisResult) {
      formatPageResult(componentResult, manager);
    }
  }
}

function formatLeakage(
  localDataLeak: DataLeakage,
  manager: TrackingManager,
  aliasMap: AliasMap,
  leakageId: number
) {
  const source = localDataLeak.chain[0];

  if (source.type == TaintType.utilLib) {
    return;
  }

  markdownLogger.info(`#### Potential Leakage ${leakageId++}\n`);
  markdownLogger.info('##### Source and Sink\n');
  formatLeakageInfo(localDataLeak, manager, aliasMap);

  markdownLogger.info('##### Propagation\n');
  formatLeakagePropagation(localDataLeak);
}

function formatLeakageInfo(
  localDataLeak: DataLeakage,
  manager: TrackingManager,
  aliasMap: AliasMap
) {
  const source = localDataLeak.chain[0];
  const sink = localDataLeak.chain[localDataLeak.chain.length - 1];

  let sourceName = aliasMap.getNameByAlias(source.name);
  if (sourceName === '') {
    sourceName = source.name;
  }
  if (manager.moduleAnalysis.utilNameToAPIName.has(sourceName)) {
    const actualSourceName = manager.getActualName(sourceName);
    markdownLogger.info(
      `- Source: \`${sourceName}\` (alias of \`${source.name}\`, has data from \`${actualSourceName}\`)`
    );
  } else {
    markdownLogger.info(
      `- Source: \`${source.name}\` (alias of \`${source.name}\`)`
    );
  }
  markdownLogger.info(
    `  - At edge \`${source.controlFlowEdge.label.replace(/\|/g, '\\|')}\`` +
      ` in \`${source.currentFunction.name}\``
  );

  const sinkLabel = sink.controlFlowEdge.label;
  const sinkAlias = getCalleeString(sinkLabel);
  let sinkApiName = aliasMap.getNameByAlias(sinkAlias);
  if (sinkApiName === '') {
    sinkApiName = sinkAlias;
  }
  if (manager.moduleAnalysis.utilNameToAPIName.has(sinkApiName)) {
    const actualSinkName = manager.getActualName(sinkApiName);
    markdownLogger.info(
      `- Sink: \`${sinkApiName}\` (alias of \`${sinkAlias}\`, sends data to \`${actualSinkName}\`)`
    );
  } else {
    markdownLogger.info(
      `- Sink: \`${sinkApiName}\` (alias of \`${sinkAlias}\`)`
    );
  }
  markdownLogger.info(
    `  - At \`${sinkLabel.replace(/\|/g, '\\|')}\` in \`${
      sink.currentFunction.name
    }\`\n`
  );

  return;
}

function formatLeakagePropagation(localDataLeak: DataLeakage) {
  markdownLogger.info(
    formatMarkdownTableHead([
      'Propagation',
      'Edge',
      'In Function',
      'Source Code Line',
    ])
  );
  for (let i = 1; i < localDataLeak.chain.length; ++i) {
    const from = localDataLeak.chain[i - 1];
    const to = localDataLeak.chain[i];
    const line = from.controlFlowEdge.loc?.start.line;
    markdownLogger.info(
      formatMarkdownTableItem([
        `\`${from.name}\` -> \`${to.name}\``,
        // replace | to \| to fit github markdown rendering
        `\`${from.controlFlowEdge.label.replace(/\|/g, '\\|')}\``,
        `\`${from.currentFunction.name}\``,
        line ? `\`${line}\`` : '',
      ])
    );
  }
  markdownLogger.info(
    formatMarkdownTableItem([
      `\`${localDataLeak.sink.name}\``,
      `\`${localDataLeak.sink.controlFlowEdge.label}\``,
      `\`${localDataLeak.sink.currentFunction.name}\``,
      `\`${localDataLeak.sink.controlFlowEdge.loc?.start.line}\``,
    ])
  );
  markdownLogger.info();
}

function formatGlobalLeakages(manager: TrackingManager) {
  const flowTable = manager.globalFlow;
  let leakageId = 1;
  markdownLogger.info('### Global Flows\n');
  flowTable.forEach((flows) => {
    flows.forEach((sinkFlow) => {
      if (sinkFlow.type === GlobalDataLeakageType.startsFromSink) {
        if (flowTable.has(sinkFlow.source.name)) {
          flowTable.get(sinkFlow.source.name).forEach((sourceFlow) => {
            if (sourceFlow.type === GlobalDataLeakageType.endsAtSource) {
              formatGlobalLeakage(sinkFlow, sourceFlow, manager, leakageId++);
            }
          });
        }
      }
    });
  });
}

function formatGlobalLeakage(
  sink: GlobalDataLeakageCompact,
  source: GlobalDataLeakageCompact,
  manager: TrackingManager,
  leakageId: number
) {
  markdownLogger.info(`#### Global Leakage ${leakageId}\n`);
  markdownLogger.info('##### Source and Sink\n');
  if (manager.moduleAnalysis.utilNameToAPIName.has(source.source.name)) {
    const actualSourceName = manager.getActualName(source.source.name);
    markdownLogger.info(
      `- Source: \`${source.source.name}\` (has data from \`${actualSourceName}\`)`
    );
  } else {
    markdownLogger.info(`- Source: \`${source.source.name}\``);
  }
  markdownLogger.info(
    `  - At edge \`${source.source.edge.replace(/\|/g, '\\|')}\` in \`${
      source.source.function
    }\``
  );
  markdownLogger.info(`  - In page ${source.page}`);

  const sinkLabel = sink.sink.edge;
  const sinkApiName = getCalleeString(sinkLabel);
  if (manager.moduleAnalysis.utilNameToAPIName.has(sinkApiName)) {
    const actualSinkName = manager.getActualName(sinkApiName);
    markdownLogger.info(
      `- Sink: \`${sinkApiName}\` (sends data to \`${actualSinkName}\`)`
    );
  } else {
    markdownLogger.info(`- Sink: \`${sinkApiName}\``);
  }
  markdownLogger.info(
    `  - At edge \`${sinkLabel.replace(/\|/g, '\\|')}\` in \`${
      sink.sink.function
    }\``
  );
  markdownLogger.info(`  - In page ${sink.page}\n`);

  markdownLogger.info('##### Propagation\n');

  markdownLogger.info(
    formatMarkdownTableHead(['Propagation', 'Edge', 'In Function', 'Page'])
  );

  let currentPage = source.page;
  for (let i = 1; i < source.chain.length; ++i) {
    const from = source.chain[i - 1];
    const to = source.chain[i];
    markdownLogger.info(
      formatMarkdownTableItem([
        `\`${from.name}\` -> \`${to.name}\``,
        `\`${from.edge.replace(/\|/g, '\\|')}\``,
        `\`${from.function}\``,
        currentPage,
      ])
    );
  }
  currentPage = sink.page;
  for (let i = 1; i < sink.chain.length; ++i) {
    const from = sink.chain[i - 1];
    const to = sink.chain[i];
    markdownLogger.info(
      formatMarkdownTableItem([
        `\`${from.name}\` -> \`${to.name}\``,
        `\`${from.edge.replace(/\|/g, '\\|')}\``,
        `\`${from.function}\``,
        currentPage,
      ])
    );
  }
}
