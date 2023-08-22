export class App {
  name: string;
  sourceTotal: number;
  sinkTotal: number;
  sourceApi: Map<string,number>;
  sinkApi: Map<string,number>;
  files: Array<JsFile>;

  constructor(name, sourceTotal, sinkTotal,sourceApi,sinkApi, files) {
    this.name = name;
    this.sourceTotal = sourceTotal;
    this.sinkTotal = sinkTotal;
    this.sourceApi = sourceApi;
    this.sinkApi = sinkApi;
    this.files = files;
  }
}

export class JsFile {
  filename: string;
  sourceTotal: number;
  sinkTotal: number;
  sourceApi: Map<string,number>;
  sinkApi: Map<string,number>;

  constructor(filename, sourceTotal, sinkTotal, sourceApi, sinkApi) {
    this.filename = filename;
    this.sourceTotal = sourceTotal;
    this.sinkTotal = sinkTotal;
    this.sourceApi = sourceApi;
    this.sinkApi = sinkApi;
  }
}
