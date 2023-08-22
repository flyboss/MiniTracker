import { Taint } from '../../interfaces/taint';
import { Page } from '../../../utils/interface/miniProgram';

export interface DataLeakage {
  chain: Array<Taint>;
  source: Taint;
  sink: Taint;
}

export interface CompactLeakageInfo {
  name: string;
  edge: string;
  function: string;
}

export enum GlobalDataLeakageType {
  endsAtSource,
  startsFromSink,
}

export interface GlobalDataLeakage extends DataLeakage {
  type: GlobalDataLeakageType;
}

export interface GlobalDataLeakageCompact {
  source: CompactLeakageInfo;
  chain: Array<CompactLeakageInfo>;
  sink: CompactLeakageInfo;
  type: GlobalDataLeakageType;
  page: string;
}

export interface PageAnalysisResult {
  page: Page;
  localDataLeaks: Array<DataLeakage>;
  globalDataFlows: Array<GlobalDataLeakage>;
  componentAnalysisResult: Array<PageAnalysisResult>;
}

export interface AppAnalysisResult {
  pageResults: PageAnalysisResult[];
  flowTable: Map<string, Array<GlobalDataLeakageCompact>>;
}
