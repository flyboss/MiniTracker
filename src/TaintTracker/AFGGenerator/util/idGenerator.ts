export interface IdGenerator {
  generateId: () => number;
}

let idGeneratorFactory = {
  create(): IdGenerator {
    let id = 0;

    return {
      generateId: () => ++id,
    };
  },
};

interface IdRecorder {
  isPageParam: boolean;
  isPageData: boolean;
  isComponentParam: boolean;
  isApp: boolean;
  lookup: (expr: string) => string;
  store: (expr: string) => void;
  storeSpecific: (expr: string, tempVarName: string) => void;
  overwrite: (original: string, current: string) => void;
  add: (original: string, current: string) => void;
}

let IdRecorderComplex = {
  create(): IdRecorder {
    let id = 0;
    let idLookUpTable: { [key: string]: string } = {};

    function _lookup(expr: string): string {
      if (idLookUpTable.hasOwnProperty(expr)) {
        return idLookUpTable[expr];
      } else {
        return '';
      }
    }

    function _store(expr: string): void {
      ++id;
      idLookUpTable[expr] = `temp${id}`;
    }

    function _storeSpecific(expr: string, tempVarName: string): void {
      idLookUpTable[expr] = tempVarName;
    }

    function _overwrite(original: string, current: string): void {
      if (idLookUpTable.hasOwnProperty(original)) {
        idLookUpTable[current] = idLookUpTable[original];
        idLookUpTable[original] = '';
      } else {
        _store(current);
      }
    }

    function _add(original: string, current: string): void {
      if (idLookUpTable.hasOwnProperty(original)) {
        idLookUpTable[current] = idLookUpTable[original];
      } else {
        _store(current);
      }
    }

    return {
      isPageParam: false,
      isPageData: false,
      isComponentParam: false,
      isApp: false,
      lookup: _lookup,
      store: _store,
      storeSpecific: _storeSpecific,
      overwrite: _overwrite,
      add: _add,
    };
  },
};

export default idGeneratorFactory;
export { IdRecorder };
export { IdRecorderComplex };
