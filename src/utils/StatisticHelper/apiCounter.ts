import { App, JsFile } from './interface/pkg';
import { mapReplacer, mapReviver, sortByKey, sortMapByValue } from '../util';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';
import * as csvparse from 'csv-parse/lib/sync';
import assert = require('assert');

function getSourceAndSink(sourceAndSinkPath) {
  const sourceAndSink = JSON.parse(
    fs.readFileSync(sourceAndSinkPath).toString()
  );
  const sourceRegMap = new Map<string, RegExp>();
  const sinkRegMap = new Map<string, RegExp>();

  for (const source of sourceAndSink.sources) {
    sourceRegMap.set(source, new RegExp('\\b' + source + '\\b', 'g'));
  }
  for (const sink of sourceAndSink.sinks) {
    sinkRegMap.set(sink, new RegExp('\\b' + sink + '\\b', 'g'));
  }

  return { sourceRegMap: sourceRegMap, sinkRegMap: sinkRegMap };
}

function countApp(appPath: string, sourceAndSink): App {
  const app = new App(
    appPath,
    0,
    0,
    new Map<string, number>(),
    new Map<string, number>(),
    new Array<JsFile>()
  );
  const files = glob.sync(app.name + '\\**\\*.js');
  for (const file of files) {
    if (file.endsWith('-temp.js')) {
      continue;
    }
    const jsFile = new JsFile(
      file,
      0,
      0,
      new Map<string, number>(),
      new Map<string, number>()
    );

    const fileStat = fs.lstatSync(file);
    if (!fileStat.isFile()) {
      console.warn(`Skipped non-file path: ${file}`);
      continue;
    }
    const content = fs.readFileSync(file).toString();

    const analysisSourceOrSink = function (regMap, api, apiTotal) {
      sourceAndSink[regMap].forEach((apiReg, apiName) => {
        const count =
          null === content.match(apiReg) ? 0 : content.match(apiReg).length;
        if (count > 0) {
          jsFile[apiTotal] += count;
          jsFile[api].set(apiName, count);

          app[apiTotal] += count;
          app[api].set(apiName, (app[api].get(apiName) || 0) + count);
        }
      });
      jsFile[api] = sortMapByValue(jsFile[api]);
    };
    analysisSourceOrSink('sourceRegMap', 'sourceApi', 'sourceTotal');
    analysisSourceOrSink('sinkRegMap', 'sinkApi', 'sinkTotal');

    jsFile.sourceTotal > 0 || jsFile.sinkTotal > 0
      ? app.files.push(jsFile)
      : void 0;
  }

  app.sourceApi = sortMapByValue(app.sourceApi);
  app.sinkApi = sortMapByValue(app.sinkApi);
  sortByKey(app.files, 'sinkTotal');
  return app;
}

function taroChecker(option) {
  const input = fs.readFileSync(option.miniProgramDetailPath).toString();
  const details = csvparse(input, {
    columns: true,
    skip_empty_lines: true,
  }) as Array<Object>;
  const noTaro = details
    .filter((detail) => detail['isTaro'] === 'false')
    .map((detail) => detail['name']);

  function isTaro(appName: string) {
    return noTaro.indexOf(appName) == -1;
  }

  return isTaro;
}

function count(option) {
  const sourceAndSink = getSourceAndSink(option.sourceAndSinkPath);
  const isTaro = taroChecker(option);
  const apps = new Array<App>();

  for (const appName of fs.readdirSync(option.miniProgramDir)) {
    if (isTaro(appName)) {
      console.log(`[Warning] Taro MiniApp: ${appName}`);
      continue;
    }
    console.log(`[App]: ${appName}`);
    let appVersion;
    fs.readdirSync(path.join(option.miniProgramDir, appName)).forEach(
      (version) => {
        if (!version.includes('result')) {
          appVersion = version;
        }
      }
    );
    assert(appVersion !== void 0, 'can not find app version.');
    const appPath = path.join(option.miniProgramDir, appName, appVersion);
    const app = countApp(appPath, sourceAndSink);
    apps.push(app);
  }

  sortByKey(apps, 'sinkTotal');
  fs.writeFileSync(
    option.resultOutputPath,
    JSON.stringify(apps, mapReplacer, 2)
  );
}

function run() {
  const wechatOption = {
    miniProgramDir: 'D:\\wxMiniPrograms',
    sourceAndSinkPath: path.join(
      __dirname,
      '../../../config/WeChatSourcesAndSinks.json'
    ),
    resultOutputPath: path.join(
      __dirname,
      '../../../statistic/WeChatAppApiStatistic.json'
    ),
    miniProgramDetailPath: path.join(
      __dirname,
      '../../../statistic/wechat-mini-program-detail.csv'
    ),
  };
  count(wechatOption);
}

run();
