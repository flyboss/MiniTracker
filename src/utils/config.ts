import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import { OptionValues } from 'commander';
import * as JSON5 from 'json5';

export let Config;

function configPlatform(commandOption: OptionValues) {
  let platformConfig;
  if (commandOption.platformType === 'wechat') {
    Config.platform = Platform.wechat;
    platformConfig = Config.wechat_config;
  } else if (commandOption.platformType === 'baidu') {
    Config.platform = Platform.baidu;
    platformConfig = Config.baidu_config;
  } else {
    throw `can not analysis mini programs of ${commandOption.platformType}`;
  }
  Config.api_prefix = platformConfig.api_prefix;
  Config.html_suffix = platformConfig.html_suffix;
  Config.input_events = platformConfig.input_events;
  Config.sources_and_sinks_path = platformConfig.sources_and_sinks_path;
}

export function initConfig(commandOption: OptionValues) {
  const pathConfigContent = fs
    .readFileSync(path.join(__dirname, '../../config/config.json5'))
    .toString();
  Config = JSON5.parse(pathConfigContent);

  Config.file_type = commandOption.fileType;
  configPlatform(commandOption);

  if (commandOption.sourcePath !== '') {
    Config.app_path = commandOption.sourcePath;
  }
  if (Config.root_dir === '') {
    Config.root_dir = path.join(__dirname, '../../');
  }
  for (const [key, value] of Object.entries(Config) as [string, string][]) {
    if (key.includes('_path') && Config[key].startsWith('.')) {
      Config[key] = path.join(Config.root_dir, value);
    }
  }

  if (commandOption.keepInterResults){
    // as we will add new files and modify some files during analysing,
    // to avoid damaging original mini program,
    // we make a copy of the mini program and save it to ${Config['app_path']}
    const temp_app_path = path.join(Config['app_path'] + '(result)');
    if (fse.existsSync(temp_app_path)) {
      fse.emptyDirSync(temp_app_path);
    } else {
      fse.mkdirSync(temp_app_path);
    }
    fse.copySync(Config['app_path'], temp_app_path);
    Config['original_app_path'] = Config['app_path'];
    Config['app_path'] = temp_app_path;

    Config['keep_intermediate_data_to_file'] = true;
  }else{
    Config['original_app_path'] = Config['app_path'];
    Config['keep_intermediate_data_to_file'] = false;
  }

  return Config;
}

export function updateConfig(key, value) {
  Config[key] = value;
}

export enum Platform {
  wechat,
  baidu,
}
