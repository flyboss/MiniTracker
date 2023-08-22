import * as esprima from 'esprima';
import * as styx from './generator';
import * as fs from 'fs';
import {Config, initConfig} from '../../utils/config';
import {commander} from "../../utils/cli";

const commandOption = commander();
initConfig(commandOption);
const dir = Config['styx_test_case_path'];

const code = fs.readFileSync(dir + '.js').toString();
const ast = esprima.parseScript(code, { loc: true });
fs.writeFileSync(dir + '.ast.json', JSON.stringify(ast, null, 2));

const flowProgram = styx.parse(ast);
const json = styx.exportAsJson(flowProgram);
fs.writeFileSync(dir + '.cfg.json', json);

let cfg = styx.exportAsDot(flowProgram.flowGraph, 'cfg');
fs.writeFileSync(dir + '0.dot', cfg);

for (let func of flowProgram.functions) {
  cfg = styx.exportAsDot(func.flowGraph, 'cfg');
  fs.writeFileSync(dir + func.id + '.dot', cfg);
}

// node out/styx/styxEnhanced.js
