import * as jsdom from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';

import { parse } from '@babel/parser';
import traverse, { TraverseOptions } from '@babel/traverse';
import generate from '@babel/generator';
import { parseHtmlFile } from './htmlParser/htmlParser';
import { HtmlFileInfo } from './htmlParser/fileInfo/htmlFileInfo';
import { Config, initConfig } from '../utils/config';
import { Page } from '../utils/interface/miniProgram';
import { getMainVisitor } from './visitors/mainVisitor';
import { loadPage } from '../utils/miniProgramLoader';
import { commander } from '../utils/cli';
import { getVariableVisitor } from './visitors/scopeVisitor';
import { getPromiseVisitor } from './visitors/promiseVisitor';
import { getRequireVisitor } from './visitors/requireAndExportVisitor';
import { getComponentVisitor } from './visitors/componentVisitor';
import {saveDataToFile} from "../utils/fileHelper";

function traversePageData(page: Page, htmlFileInfo: HtmlFileInfo): string {
  let ast = parse(page.js);
  // TODO Merge visitors whenever possible
  // https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#merge-visitors-whenever-possible

  // !! Attention visitor order is very important
  traverse(ast, getMainVisitor(page, htmlFileInfo));
  traverse(ast, getComponentVisitor());
  traverse(ast, getVariableVisitor());
  traverse(ast, getPromiseVisitor());
  traverse(ast, getRequireVisitor(page));
  const output = generate(ast, {}, page.js);
  saveDataToFile(page.dir + '-traverse.js', output.code);
  return output.code;
}

export function transpilePage(page: Page) {
  const htmlFileInfo = parseHtmlFile(page.html);
  saveDataToFile(page.dir + '-htmlInfo.json', JSON.stringify(htmlFileInfo));
  page.js = traversePageData(page, htmlFileInfo);
  return page;
}

if (require.main === module) {
  const commandOption = commander();
  initConfig(commandOption);
  const pagePath = path.join(
    __dirname,
    '../../test/sourceCodeAnalysis/pages/page1'
  );
  let page = loadPage(pagePath);
  transpilePage(page);
}
