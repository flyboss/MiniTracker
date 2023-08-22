import { JsFile, MiniProgram } from '../utils/interface/miniProgram';
import { logger } from '../utils/logHelper';

class AOVNode {
  name: string;
  in: number;
  out: string[];
  jsFile: JsFile;

  constructor(name: string, jsFile?: JsFile) {
    this.name = name;
    this.in = 0;
    this.out = [];
    this.jsFile = jsFile;
  }

  toString() {
    return this.name;
  }
}

export function getOrder(app: MiniProgram): Array<JsFile> {
  const aovMap = new Map<string, AOVNode>();

  const dealRequire = function (aovNode: AOVNode, utilNames: string[]) {
    for (const utilName of utilNames) {
      let newAovNode = aovMap.get(utilName);
      if (!newAovNode) {
        app.utilPathToNameMap.nameMap.forEach((name) => {
          if (name === utilName) {
            newAovNode = new AOVNode(utilName);
            aovMap.set(utilName, newAovNode);
          }
        });
      }
      if (newAovNode) {
        newAovNode.out.push(aovNode.name);
        aovNode.in++;
      }
    }
  };
  app.utilJsFiles.forEach((jsFile) => {
    let aovNode = aovMap.get(jsFile.name);
    if (!aovNode) {
      aovNode = new AOVNode(jsFile.name);
      aovMap.set(jsFile.name, aovNode);
    }
    aovNode.jsFile = jsFile;
    dealRequire(aovNode, jsFile.requireUtilNames);
  });
  const stack = [],
    order = new Array<AOVNode>();
  let count = 0;
  aovMap.forEach((value) => {
    if (value.in === 0) {
      stack.push(value);
    }
  });
  while (stack.length > 0) {
    const aovNode = stack.pop();
    count++;
    order.push(aovNode);
    for (const o of aovMap.get(aovNode.name).out) {
      const temp = aovMap.get(o);
      if (--temp.in === 0) {
        stack.push(temp);
      }
    }
  }
  if (count !== app.utilJsFiles.length) {
    logger.warn('some util js have circular references');
  }
  // logger.info('util js analysis order: ', order);
  const jsFileOrder = order
    .filter((aovNode) => {
      if (aovNode.jsFile !== void 0) {
        return aovNode.jsFile;
      } else {
        logger.error(`cannot find util js file of ${aovNode.name}`);
      }
    })
    .map((aovNode) => {
      return aovNode.jsFile;
    });
  return jsFileOrder;
}
