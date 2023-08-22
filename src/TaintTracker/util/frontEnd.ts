import * as esprima from 'esprima';
import * as Styx from '../AFGGenerator/generator';
import { Page } from '../../utils/interface/miniProgram';
import { transpilePage } from '../../PageAnalyzer/irTranspiler';
import { saveDataToFile } from '../../utils/fileHelper';

export function parseJs(js: string, dir: string) {
  // parse .js into esprima ast
  const ast = esprima.parseScript(js,{ loc: true });
  saveDataToFile(dir + '.ast.json', JSON.stringify(ast, null, 2));

  // parse esprima ast into cfg
  const flowProgram = Styx.parse(ast);
  const json = Styx.exportAsJson(flowProgram);
  saveDataToFile(dir + '.cfg.json', json);

  const main = flowProgram.flowGraph;
  // let { funcToEnclosedFuncs, funcToEnclosingFunc } = getFunctionRelationships();
  flowProgram.functions.unshift({
    id: 0,
    name: '__main__',
    parameters: [],
    returnValues: [],
    flowGraph: main,
    // enclosedFuncs: funcToEnclosedFuncs.get('__main__'),
    // enclosingFunc: funcToEnclosingFunc.get('__main__'),
  });

  saveFunc(dir, flowProgram.functions, 'cfg', '');
  // clearFunctionRelationships();
  return flowProgram;
}

export function processAndParsePage(page: Page) {
  page = transpilePage(page);
  return parseJs(page.js, page.dir);
}

export function saveFunc(
  dir: string,
  functions: Styx.FlowFunction[],
  graphName: string,
  suffix: string
) {
  for (const func of functions) {
    const cfg = Styx.exportAsDot(func.flowGraph, graphName);
    saveDataToFile(dir + func.name + suffix + '.dot', cfg);
  }
}
