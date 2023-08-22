import { loadJS } from '../../utils/miniProgramLoader';
import { parseJs } from '../../TaintTracker/util/frontEnd';
import { JsFile, MiniProgram } from '../../utils/interface/miniProgram';
import { extraPasses } from '../../TaintTracker/asyncFlow/callbackPass';
import { logger } from '../../utils/logHelper';
import { getOrder } from '../orderAnalysis';
import {
  updateSourceAndSinkFunctions,
  updateSourceIdentifiers,
} from '../../TaintTracker/util/sourceAndSinkHelper';
import { performAliasSearch } from '../../TaintTracker/functionAliasSearch/functionAliasMap';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { getVariableVisitor } from '../../PageAnalyzer/visitors/scopeVisitor';
import { getPromiseVisitor } from '../../PageAnalyzer/visitors/promiseVisitor';
import generate from '@babel/generator';
import {
  getRequireVisitor,
  getExportVisitor,
} from '../../PageAnalyzer/visitors/requireAndExportVisitor';
import { getTaintedIdentifiers } from './exportAnalysis';
import { getSinks, getSources } from './functionAnalysis';
import { TrackingManager } from '../../miniTracker';
import {saveDataToFile} from "../../utils/fileHelper";

function traverseUtilJs(jsFile: JsFile): void {
  logger.info(`traverse ${jsFile.name}`);
  const ast = parse(jsFile.content);
  traverse(ast, getVariableVisitor());
  traverse(ast, getPromiseVisitor());
  traverse(ast, getRequireVisitor(jsFile));
  traverse(ast, getExportVisitor(jsFile));
  jsFile.content = generate(ast, {}, jsFile.content).code;
  saveDataToFile(
    jsFile.filepath.replace('.js', '-traverse.js'),
    jsFile.content
  );
}

export function dealUtilJs(app: MiniProgram, manager: TrackingManager): void {
  logger.info('Analyzing util js files');
  app.utilPathToNameMap.nameMap.forEach((name, jsPath) => {
    const jsFile = new JsFile(jsPath, loadJS(jsPath), name);
    traverseUtilJs(jsFile);
    app.utilJsFiles.push(jsFile);
    manager.moduleAnalysis.utilLibToPath.set(name, jsPath);
  });
  for (const jsFile of getOrder(app)) {
    logger.info(`Analyzing ${jsFile.name}, filepath: ${jsFile.filepath}`);
    try {
      jsFile.cfg = parseJs(jsFile.content, jsFile.filepath);
      performAliasSearch(jsFile);
      extraPasses(jsFile.cfg, jsFile.funcAliasMap, jsFile.filepath);

      manager.moduleAnalysis.utilAnalysisMode = true;

      logger.info(`Analyzing sinks.`);
      const newSinks = getSinks(jsFile, manager);
      logger.info(`Analyzing sources.`);
      const newSources = getSources(jsFile, manager);

      updateSourceAndSinkFunctions(
        Array.from(newSources),
        Array.from(newSinks)
      );

      logger.info(`Analyzing exported identifiers.`);
      updateSourceIdentifiers(getTaintedIdentifiers(jsFile, manager));
    } catch (e) {
      logger.error(`Util js file ${jsFile.name} has error: ${e.stack}`);
    } finally {
      manager.moduleAnalysis.utilAnalysisMode = false;
    }
  }
  logger.info('All util js files analyzed.');
}
