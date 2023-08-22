import { TaintType } from './TaintTracker/interfaces/taint';
import { locateSinkCalls as initializeWorklist } from './TaintTracker/worklist/interProcedural';
import { Helper } from './TaintTracker/worklist/helper';
import { runWorklist } from './TaintTracker/worklist/taintedAssignments/taintedAssignments';
import { initConfig } from './utils/config';
import { performAliasSearch } from './TaintTracker/functionAliasSearch/functionAliasMap';
import { extraPasses } from './TaintTracker/asyncFlow/callbackPass';
import {
  multiPageOutput,
  singlePageOutput,
} from './TaintTracker/util/leakage/leakagePrinter';
import { MiniProgram, Page } from './utils/interface/miniProgram';
import { processAndParsePage } from './TaintTracker/util/frontEnd';
import { loadEntireApp, loadSinglePage } from './utils/miniProgramLoader';
import { commander } from './utils/cli';
import { initLogger, logger } from './utils/logHelper';
import { dealUtilJs } from './UtilAnalyzer/exportAnalysis/utilsTracker';
import { initSourceAndSink } from './TaintTracker/util/sourceAndSinkHelper';
import { shutdown as logShutdown } from 'log4js';
import {
  convertToCompactGlobalFlowTable,
  generateDataFlow,
  generateGlobalDataFlow,
} from './TaintTracker/util/leakage/leakageGenerator';
import {
  AppAnalysisResult,
  DataLeakage,
  GlobalDataLeakage,
  GlobalDataLeakageCompact,
  PageAnalysisResult,
} from './TaintTracker/util/leakage/interface';
import { dealGetApp } from './UtilAnalyzer/getAppAnalysis/getAppAnalysis';
import * as fs from 'fs';

// export let utilFuncNameToActualFuncName: Map<string, string>;

export class TrackingManager {
  pageResults: Array<PageAnalysisResult>;
  globalFlow: Map<string, Array<GlobalDataLeakageCompact>>;
  rootdir: string;
  moduleAnalysis: {
    utilLibToPath: Map<string, string>;
    utilNameToAPIName: Map<string, string>;
    utilAnalysisMode: boolean;
    getAppAnalysisMode: boolean;
    utilLocalFlows: Array<PageAnalysisResult>;
  };

  constructor() {
    this.pageResults = new Array();
    this.globalFlow = new Map();
    this.moduleAnalysis = {
      utilLibToPath: new Map(),
      utilNameToAPIName: new Map(),
      utilAnalysisMode: false,
      getAppAnalysisMode: false,
      utilLocalFlows: new Array(),
    };
    this.rootdir = '';
  }

  public getActualName(name: string) {
    let actualName = this.moduleAnalysis.utilNameToAPIName.get(name);
    while (this.moduleAnalysis.utilNameToAPIName.has(actualName)) {
      actualName = this.moduleAnalysis.utilNameToAPIName.get(actualName);
    }

    return actualName;
  }
}

export function multiPagesWorklist(
  miniapp: MiniProgram,
  manager: TrackingManager
): AppAnalysisResult {
  logger.info(`Analyzing app.js`);
  dealGetApp(miniapp.app, manager);
  const result = singlePageWorklist(miniapp.app, manager);
  if (result.localDataLeaks) {
    manager.pageResults.push(result);
  }
  if (result.globalDataFlows) {
    convertToCompactGlobalFlowTable(
      result.globalDataFlows,
      result.page.name,
      miniapp.app.dir,
      manager.globalFlow
    );
  }

  for (const page of miniapp.pages) {
    const result = singlePageWorklist(page, manager);
    if (!result || !result.localDataLeaks) {
      continue;
    }
    manager.pageResults.push(result);
    convertToCompactGlobalFlowTable(
      result.globalDataFlows,
      result.page.name,
      page.dir,
      manager.globalFlow
    );
  }

  return {
    pageResults: manager.pageResults.concat(
      manager.moduleAnalysis.utilLocalFlows
    ),
    flowTable: manager.globalFlow,
  };
}

export function singlePageWorklist(
  page: Page,
  manager: TrackingManager
): PageAnalysisResult | null {
  logger.info(`Analyzing page: ${page.name}`);
  if (!fs.existsSync(page.dir + '.js')) {
    logger.error(
      `Page or component directory ${page.dir + '.js'} does not exist.`
    );
    return <PageAnalysisResult>{
      page: page,
      localDataLeaks: null,
      globalDataFlows: null,
      componentAnalysisResult: null,
    };
  }
  try {
    const componentAnalysisResult = new Array<PageAnalysisResult>();
    if (!page.isComponent) {
      for (let component of page.components) {
        logger.info(`Analyzing component: ${component.name}`);
        componentAnalysisResult.push(singlePageWorklist(component, manager));
      }
    }

    // get cfg
    if (page.js === undefined || page.js === '') {
      logger.warn(`Empty page js ${page.name}. Skipping.`);
      return <PageAnalysisResult>{
        page: page,
        localDataLeaks: null,
        globalDataFlows: null,
        componentAnalysisResult: null,
      };
    }

    page.cfg = processAndParsePage(page);

    // first pass: alias search
    logger.info('Performing alias search.');
    performAliasSearch(page);

    // second pass: cfg minor modifications
    logger.info('Performing second pass.');
    extraPasses(page.cfg, page.funcAliasMap, page.filepath);

    // third pass: initialize worklist
    const helper = new Helper();
    if (manager) {
      helper.manager = manager;
    }
    logger.info('Initializing worklist.');
    initializeWorklist(page.cfg, helper, page.funcAliasMap);

    // analysis stage: worklist algorithm
    runWorklist(helper, page);

    // output stage: convert result and output
    logger.info('Done!');
    let globalDataFlows = new Array<GlobalDataLeakage>();
    let localDataLeaks = new Array<DataLeakage>();
    for (const taintFlow of helper.dep) {
      if (
        taintFlow.source === null ||
        taintFlow.source?.type === TaintType.global
      ) {
        globalDataFlows = globalDataFlows.concat(
          generateGlobalDataFlow(taintFlow.source ?? taintFlow.target)
        );
      }
      if (taintFlow.source === null) {
        localDataLeaks = localDataLeaks.concat(
          generateDataFlow(taintFlow.target)
        );
      }
    }

    return <PageAnalysisResult>{
      page: page,
      localDataLeaks: localDataLeaks,
      globalDataFlows: globalDataFlows,
      componentAnalysisResult: componentAnalysisResult,
    };
  } catch (e) {
    logger.error(`Page or component ${page.name} has error: ${e.stack}`);
    return <PageAnalysisResult>{
      page: page,
      localDataLeaks: null,
      globalDataFlows: null,
      componentAnalysisResult: null,
    };
  }
}

function run() {
  const commandOption = commander();
  initConfig(commandOption);
  initLogger(commandOption);
  initSourceAndSink();

  try {
    if (commandOption.fileType === 'single') {
      const page = loadSinglePage();
      const result = singlePageWorklist(page, null);
      singlePageOutput(result);
    } else if (commandOption.fileType === 'all') {
      const S_PER_NS = 1e-9;
      const NS_PER_SEC = 1e9;
      const time = process.hrtime();

      const app = loadEntireApp();
      const manager = new TrackingManager();
      manager.rootdir = app.dir;
      dealUtilJs(app, manager);
      const results = multiPagesWorklist(app, manager);
      multiPageOutput(results, manager);

      const diff = process.hrtime(time);
      const time_elapsed = (diff[0] * NS_PER_SEC + diff[1]) * S_PER_NS;
      const mins = Math.floor(time_elapsed / 60);
      const secs = (time_elapsed % 60).toFixed(2);
      logger.info(`Time Elapsed: ${mins} min ${secs} sec.`);
    }
  } catch (e) {
    logger.error(e);
  } finally {
    logShutdown();
  }
}

if (require.main === module) {
  run();
}
