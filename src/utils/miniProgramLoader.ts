import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { Config } from './config';
import {
  MiniProgram,
  MiniProgramAppJSON,
  MiniProgramSubpackage,
  Page,
  UtilPathToNameMap,
} from './interface/miniProgram';
import { logger } from './logHelper';
import { setUtilPathToNameMap } from '../PageAnalyzer/visitors/requireAndExportVisitor';

export function loadSinglePage(): Page {
  const singlePageDir = Config['worklist_test_case_path'];
  const utilPathToNameMap = new UtilPathToNameMap(singlePageDir);
  setUtilPathToNameMap(utilPathToNameMap);
  return loadPage(singlePageDir);
}

export function loadPage(dir: string = ''): Page {
  const name = dir.replace(/.*pages/, '');
  const js = loadJS(dir);
  const html = loadHTML(dir);
  const json = loadJSON(dir);

  return new Page(name, dir, js, json, html);
}

export function loadComponentAsPage(name: string, path: string): Page {
  const js = loadJS(path);
  const html = loadHTML(path);
  const json = loadJSON(path);
  const dir = path;
  return new Page(name, dir, js, json, html, true);
}

function loadJSON(dir: string): any {
  const jsonPath = dir + '.json';
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath).toString());
  } else {
    logger.warn(
      'json does not exist.',
      jsonPath.replace(Config['app_path'], '')
    );
    return null;
  }
}

function loadHTML(dir: string): string {
  const htmlPath = dir + Config['html_suffix'];
  if (fs.existsSync(htmlPath)) {
    return fs.readFileSync(htmlPath).toString();
  } else {
    logger.warn(
      ' html-like file does not exist, and therefore will not be analyzed: ' +
        htmlPath.replace(Config['app_path'], '')
    );
    return null;
  }
}

export function loadJS(dir: string): string {
  const jsPath = dir.endsWith('.js') ? dir : dir + '.js';
  if (fs.existsSync(jsPath)) {
    return fs.readFileSync(jsPath).toString();
  } else {
    logger.error('js file does not exist: ' + jsPath);
    return null;
  }
}

export function loadEntireApp(): MiniProgram {
  const appDir = Config['app_path'];
  const app = new MiniProgram(appDir);
  if (fs.existsSync(path.join(app.dir, 'app.js'))) {
    app.app = loadPage(path.join(appDir, 'app'));
    app.app.name = 'app.js';
  } else {
    throw `app.js does not exist in ${appDir}`;
  }
  getPages(app);
  getAllUtilJs(app);
  return app;
}

function getPages(app: MiniProgram) {
  if (fs.existsSync(path.join(app.dir, 'app.json'))) {
    const appJSON = JSON.parse(
      fs.readFileSync(path.join(app.dir, 'app.json')).toString()
    );
    const pagesDir = <MiniProgramAppJSON>{ pages: appJSON['pages'] };
    for (const page of pagesDir.pages) {
      const pageDir = path.join(app.dir, page);
      const currentPage = loadPage(pageDir);
      app.pages.push(currentPage);
      logger.info(`Loaded page ${currentPage.name}`);
    }
    const subpackages = <Array<MiniProgramSubpackage>>appJSON['subPackages'] ?? [];
    for (const subpackage of subpackages) {
      logger.info(`Loading SubPackage: ${subpackage.name}`);
      const subpackRoot = path.join(app.dir, subpackage.root);
      for (const page of subpackage.pages) {
        const pageDir = path.join(subpackRoot, page);
        const currentPage = loadPage(pageDir);
        app.pages.push(currentPage);
        logger.info(
          `Loaded page ${currentPage.name} of subpackage ${subpackage.name}`
        );
      }
    }
  } else {
    throw 'app.json does not exist!';
  }
}

function getAllUtilJs(app: MiniProgram) {
  const reg = new RegExp(/(\d)+.js/);
  if (fs.readdirSync(app.dir).some((jsPath) => reg.test(jsPath))) {
    // 部分百度目小程序，匹配根目录下 数字开头的js，
    for (const jsPath of fs.readdirSync(app.dir)) {
      if (reg.test(jsPath)) {
        app.utilPathToNameMap.setName(path.join(app.dir, jsPath));
      }
    }
  } else {
    // 部分百度目小程序+全部微信小程序
    const pageAndComponentJsPath = new Set<string>();
    getPageAndComponentJsPath(app, pageAndComponentJsPath);
    const isUtilJsPath = function (
      filepath: string,
      pageAndComponentJsPath: Set<string>
    ): boolean {
      if (pageAndComponentJsPath.has(filepath)) {
        // js is page or component js, not util js
        return false;
      } else if (filepath.split(path.sep).includes('@babel')) {
        return false;
      } else if (
        filepath.endsWith('-temp.js') ||
        filepath.endsWith('.swan.js') ||
        filepath.endsWith('-traverse.js') ||
        filepath.endsWith('app.js')
      ) {
        return false;
      } else {
        return true;
      }
    };
    glob.sync(app.dir + '/**/*.js').forEach((jsPath) => {
      jsPath = path.normalize(jsPath);
      if (isUtilJsPath(jsPath, pageAndComponentJsPath)) {
        app.utilPathToNameMap.setName(jsPath);
      }
    });
  }
  app.utilPathToNameMap.nameMap.forEach((name, jsPath) => {
    logger.debug(`${name}: ${jsPath}`);
  });
  setUtilPathToNameMap(app.utilPathToNameMap);
}

function getPageAndComponentJsPath(
  app: MiniProgram,
  pageAndComponentJsPath: Set<string>
) {
  const getJsPath = function (
    page: Page,
    pageAndComponentJsPaths: Set<string>
  ) {
    pageAndComponentJsPaths.add(page.dir + '.js');
    page.components.forEach((component) => {
      getJsPath(component, pageAndComponentJsPaths);
    });
  };
  app.pages.forEach((page) => {
    getJsPath(page, pageAndComponentJsPath);
  });
}
