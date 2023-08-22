import * as fs from 'fs';
import * as path from 'path';

/**
 * Usage:
 * Put markdown results to ./logs/MarkdownResults
 * and run this.
 */

enum CounterMode {
  sources,
  sinks,
}

function run() {
  const result_dir = './logs/MarkdownResults';
  const outputFileName = 'counts.csv';
  let sinkAppearanceCounter = new Map<string, number>();
  let uniqueSinkCounter = new Map<string, Set<string>>();
  let sourceAppearanceCounter = new Map<string, number>();
  let uniqueSourceCounter = new Map<string, Set<string>>();
  let appCallerCounter = new Map<string, Set<string>>();

  function getAPIName(api: string): string {
    if (api.includes('(')) {
      const parenthesisMatcher = api.match(/\(.*\)/);
      if (parenthesisMatcher) {
        api = parenthesisMatcher[0];
        api = api.substring(1, api.length - 1);
        return api;
      }
      throw new Error(`Buggy invalid API name: ${api}`);
    }
    return api;
  }

  function getPlatform(api: string): string {
    return api.split('.')[0];
  }

  function updateUniqueCounter(
    counter: Map<string, Set<string>>,
    apiName: string,
    appName: string
  ) {
    if (counter.has(appName)) {
      counter.get(appName).add(apiName);
    } else {
      counter.set(appName, new Set([apiName]));
    }
  }

  function printUniqueCounters(
    sourceCounter: Map<string, Set<string>>,
    sinkCounter: Map<string, Set<string>>
  ) {
    sourceCounter.forEach((val, key) => {
      console.log(
        `${key}: Sources: ${val.size}. Sinks: ${sinkCounter.get(key).size}`
      );
    });
  }

  function updateTotalCounter(
    counter: Map<string, number>,
    apiName: string,
    apiAppearance: number
  ) {
    if (counter.has(apiName)) {
      counter.set(apiName, counter.get(apiName) + apiAppearance);
    } else {
      counter.set(apiName, apiAppearance);
    }
  }

  function updatePerAPPCounter(apiName: string, appName: string) {
    if (appCallerCounter.has(apiName)) {
      appCallerCounter.get(apiName).add(appName);
    } else {
      appCallerCounter.set(apiName, new Set([apiName]));
    }
  }

  function countAPIs(apis: string, appName: string) {
    let mode: CounterMode = CounterMode.sources;
    for (const line of apis.split('\n')) {
      if (line.startsWith('- Sinks')) {
        mode = CounterMode.sinks;
      }
      if (line.startsWith('  - ')) {
        const pair = line.replace('  - ', '').split(': ');
        const apiName = getAPIName(pair[0]);
        const apiAppearance = parseInt(pair[1]);
        if (mode === CounterMode.sources) {
          updateUniqueCounter(uniqueSourceCounter, apiName, appName);
          updateTotalCounter(sourceAppearanceCounter, apiName, apiAppearance);
        } else {
          updateUniqueCounter(uniqueSinkCounter, apiName, appName);
          updateTotalCounter(sinkAppearanceCounter, apiName, apiAppearance);
        }
        updatePerAPPCounter(apiName, appName);
      }
    }
  }

  for (const mdFileName of fs.readdirSync(result_dir)) {
    if (!mdFileName.endsWith('.md')) {
      console.log(`Skipped non-markdown file ${mdFileName}`);
      continue;
    }
    console.log(`Reading File ${mdFileName}`);
    const appName = mdFileName.split('-')[0];
    console.log(`App ${appName}`);
    const mdFilePath = path.join(
      __dirname,
      '../../../logs/MarkdownResults',
      mdFileName
    );
    const mdFileContent = fs.readFileSync(mdFilePath).toString();
    const blocks = mdFileContent.split(/#### .*/);
    const localApi = blocks[1];
    const globalApi = blocks[2];
    countAPIs(localApi, appName);
    countAPIs(globalApi, appName);
  }

  console.log('\nResults');
  const outputFilePath = path.join(
    __dirname,
    '../../../logs/MarkdownResults',
    outputFileName
  );
  fs.writeFileSync(
    outputFilePath,
    'ApiName,TotalAppearances,NumOfApps,Type,Platform\n'
  );
  for (const api of sourceAppearanceCounter.keys()) {
    const totalAppearance = sourceAppearanceCounter.get(api);
    const appCallers = appCallerCounter.get(api).size;
    console.log(
      `  - API: ${api} ` + `| ${totalAppearance} ` + `| ${appCallers}`
    );

    fs.appendFileSync(
      outputFilePath,
      `${api},${totalAppearance},${appCallers},source,${getPlatform(api)}\n`
    );
  }
  for (const api of sinkAppearanceCounter.keys()) {
    const totalAppearance = sinkAppearanceCounter.get(api);
    const appCallers = appCallerCounter.get(api).size;
    console.log(
      `  - API: ${api} ` + `| ${totalAppearance} ` + `| ${appCallers}`
    );

    fs.appendFileSync(
      outputFilePath,
      `${api},${totalAppearance},${appCallers},sink,${getPlatform(api)}\n`
    );
  }
  console.log(`\nOutputted results to ${outputFilePath}`);
  printUniqueCounters(uniqueSourceCounter, uniqueSinkCounter);
}

run();
