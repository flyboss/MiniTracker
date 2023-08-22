import * as fs from 'fs';
import { Config } from '../../utils/config';
import { logger } from '../../utils/logHelper';

let sourceFunctions: string[];
let sinkFunctions: string[];
let sourceIdentifiers: string[];

export function initSourceAndSink() {
  ({ sources: sourceFunctions, sinks: sinkFunctions } = JSON.parse(
    fs.readFileSync(Config['sources_and_sinks_path']).toString()
  ));
  sourceIdentifiers = new Array<string>();
}

export function updateSourceAndSinkFunctions(
  newSources: string[],
  newSinks: string[]
) {
  if (newSources.length > 0) {
    logger.debug('Added util source functions: ', newSources);
    sourceFunctions = sourceFunctions.concat(newSources);
  }
  if (newSinks.length > 0) {
    logger.debug('Added util sink functions: ', newSinks);
    sinkFunctions = sinkFunctions.concat(newSinks);
  }
}

export function updateSourceIdentifiers(newIdentifiers: string[]) {
  if (newIdentifiers.length > 0) {
    logger.debug(`Added util source identifiers: ${newIdentifiers}`);
    sourceIdentifiers = sourceIdentifiers.concat(newIdentifiers);
  }
}

export function getSourceAndSink() {
  return {
    sourceFunctions: sourceFunctions,
    sinkFunctions: sinkFunctions,
    sourceIdentifiers: sourceIdentifiers,
  };
}
