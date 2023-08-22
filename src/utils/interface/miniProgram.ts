import * as path from 'path';
import * as Styx from '../../TaintTracker/AFGGenerator/generator';
import { loadComponentAsPage } from '../miniProgramLoader';
import { AliasMap } from '../../TaintTracker/functionAliasSearch/functionAliasMap';
import IdRecorder, { IdGenerator } from '../../TaintTracker/AFGGenerator/util/idGenerator';
import { logger } from '../logHelper';
import { Config } from '../config';

export interface MiniProgramAppJSON {
  pages: Array<string>;
}

export interface MiniProgramSubpackage {
  root: string;
  name: string;
  pages: Array<string>;
}

export let libNameMap;

export class MiniProgram {
  dir: string;
  pages: Array<Page>;
  app: Page;
  utilPathToNameMap: UtilPathToNameMap;
  utilJsFiles: Array<JsFile>;

  constructor(dir: string) {
    this.dir = dir;
    this.pages = new Array<Page>();
    this.utilPathToNameMap = new UtilPathToNameMap(dir);
    this.utilJsFiles = new Array<JsFile>();
  }
}

export interface BasicJs {
  name: string;
  cfg: Styx.FlowProgram;
  funcAliasMap: AliasMap;
  requireUtilNames: string[];
  filepath: string;
  moduleExportObj: ExportUnit;
}

export class Page implements BasicJs {
  name: string;
  dir: string;
  js: string;
  filepath: string;
  html: string;
  json: any;
  isComponent: boolean;
  components: Array<Page>;
  cfg: Styx.FlowProgram;
  funcAliasMap: AliasMap;
  requireUtilNames: string[];
  moduleExportObj: ExportUnit;

  constructor(
    name: string,
    dir: string,
    js: string,
    json: any,
    html: string,
    isComponent: boolean = false
  ) {
    this.name = name;
    this.dir = dir;
    this.filepath = dir + '.js';
    this.js = js;
    this.json = json;
    this.html = html;
    this.components = new Array<Page>();
    this.isComponent = isComponent;
    this.requireUtilNames = [];

    if (!this.isComponent) {
      let components = this.json?.usingComponents;
      for (let component in components) {
        let componentPath: string = components[component];
        if (componentPath.startsWith('dynamicLib://')) {
          componentPath = componentPath.replace(
            'dynamicLib://',
            '/__dynamicLib__/'
          );
        }
        if (componentPath.startsWith('/')) {
          componentPath = path.join(Config['app_path'], componentPath);
        } else {
          componentPath = path.resolve(
            path.dirname(this.dir),
            componentPath
          );
        }
        let currentComponent = loadComponentAsPage(component, componentPath);
        this.components.push(currentComponent);
      }
    }
  }
}

export class JsFile implements BasicJs {
  filepath: string;
  name: string;
  content: string;
  cfg: Styx.FlowProgram;
  funcAliasMap: AliasMap;
  requireUtilNames: string[];
  exportFunctions: ExportUnit[];
  moduleExportObj: ExportUnit;

  constructor(filepath: string, content: string, name: string) {
    this.filepath = filepath;
    this.content = content;
    this.name = name;
    this.requireUtilNames = [];
    this.exportFunctions = [];
    this.moduleExportObj = null;
  }
}

export class ExportUnit {
  name: string;

  constructor(name) {
    this.name = name;
  }
}

export class UtilPathToNameMap {
  utilIdGenerator: IdGenerator;
  appPath: string;
  // util js filepath and its name
  nameMap: Map<string, string>;
  // some required util js are not in the app;
  isnotInAppButisRequiredNameMap: Map<string, string>;

  constructor(appPath) {
    this.utilIdGenerator = IdRecorder.create();
    this.appPath = appPath;
    this.nameMap = new Map();
    this.isnotInAppButisRequiredNameMap = new Map();
  }

  getName(filepath: string): string {
    if (this.nameMap.has(filepath)) {
      return this.nameMap.get(filepath);
    } else {
      if (this.isnotInAppButisRequiredNameMap.has(filepath)) {
        return this.isnotInAppButisRequiredNameMap.get(filepath);
      } else {
        const libName =
          '__lib_not_in_app__' + this.utilIdGenerator.generateId().toString();
        this.isnotInAppButisRequiredNameMap.set(filepath, libName);
        return libName;
      }
    }
  }

  setName(filepath: string): string {
    if (this.nameMap.has(filepath)) {
      return this.nameMap.get(filepath);
    } else {
      const name = '__lib__' + this.utilIdGenerator.generateId().toString();
      this.nameMap.set(filepath, name);
      return name;
    }
  }

  getNameFromNumber(number: string): string {
    const filepath = path.join(this.appPath, number + '.js');
    return this.getName(filepath);
  }

  getNameFromString(filepath: string): string {
    filepath = filepath.endsWith('.js') ? filepath : filepath + '.js';
    filepath = filepath.startsWith(Config['app_path'])
      ? filepath
      : filepath.replace(Config['original_app_path'], Config['app_path']);
    return this.getName(filepath);
  }
}
