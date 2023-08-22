import { configure, getLogger } from 'log4js';
import { Config } from './config';
import * as path from 'path';
import moment = require('moment');
import {OptionValues} from "commander";

export function initLogger(commandOption: OptionValues) {
  //https://github.com/log4js-node/log4js-node/blob/master/docs/layouts.md
  configure({
    appenders: {
      stdout: {
        type: 'stdout',
        layout: {
          type: 'pattern',
          pattern: '%[%d{MM/dd-hh.mm} [%p]%] [%f{1}] %m',
        },
      },
      file: {
        type: 'file',
        filename: 'log.log',
        layout: {
          type: 'pattern',
          pattern: '%d{MM/dd-hh.mm} [%p] [%f{1}] %m',
        },
      },
      multi: {
        type: 'multiFile',
        base: commandOption.logPath,
        property: 'logFilename',
        extension: '.log',
        layout: {
          type: 'pattern',
          pattern: '%d{MM/dd-hh.mm} [%p] [%f{1}] %m',
        },
      },
      markdown: {
        type: 'multiFile',
        base: commandOption.logPath,
        property: 'logFilename',
        extension: '.md',
        layout: {
          type: 'pattern',
          pattern: '%m',
        },

      },
    },
    categories: {
      default: {
        appenders: ['stdout'],
        level: 'trace',
        enableCallStack: true,
      },
      single: {
        appenders: ['stdout'],
        level: 'trace',
        enableCallStack: true,
      },
      all: {
        appenders: ['stdout', 'multi'],
        level: 'debug',
        enableCallStack: true,
      },
      markdown: {
        appenders: ['markdown'],
        level: 'debug',
        enableCallStack: true,
      },
    },
  });

  logger = getLogger(Config['file_type']);
  const currentTime = moment(Date.now()).format('-MM-DD-HH-mm');
  const appPath = Config['app_path'].split(path.sep).filter(s=>s.length>0);
  logger.addContext('logFilename', appPath[appPath.length - 2] + currentTime);
  logger.useCallStack = true;

  markdownLogger = getLogger('markdown');
  markdownLogger.addContext('logFilename', appPath[appPath.length - 2] + currentTime + '-leakages');
}

export let logger;
export let markdownLogger;
