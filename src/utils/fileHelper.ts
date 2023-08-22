import * as fs from 'fs';
import { PathLike } from 'fs';
import { logger } from './logHelper';
import {Config} from "./config";

export function saveDataToFile(path: PathLike, data: string) {
  if (Config['keep_intermediate_data_to_file'] === true){
    // fs.writeFile(path, data, (err) => {
    //   if (err) {
    //     logger.error(`save file ${path} has failed, the reason is ${err.stack}`);
    //   }
    // });
    fs.writeFileSync(path, data);
  }
}

