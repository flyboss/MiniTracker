import { logger } from '../../../../utils/logHelper';
import * as ESTree from '../../estree';

import IdGenerator from '../../util/idGenerator';

export { rewriteFunctionExpressions };

// let funcToEnclosingFunc: Map<string, string>;
// let funcToEnclosedFuncs: Map<string, Array<string>>;
// let enclosingFunctions: Array<string>;

// export function getFunctionRelationships() {
//   return {
//     funcToEnclosingFunc: funcToEnclosingFunc,
//     funcToEnclosedFuncs: funcToEnclosedFuncs,
//   };
// }

// export function clearFunctionRelationships() {
//   funcToEnclosingFunc = void 0;
//   funcToEnclosedFuncs = void 0;
// }

// function getEnclosingFunction() {
//   if (enclosingFunctions.length) {
//     return enclosingFunctions[enclosingFunctions.length - 1];
//   }
// }

// function createEnclosingFuncToFunc() {
//   funcToEnclosedFuncs = new Map();
//   funcToEnclosingFunc.forEach((enclosingFunc, func) => {
//     if (funcToEnclosedFuncs.has(enclosingFunc)) {
//       funcToEnclosedFuncs.get(enclosingFunc).push(func);
//     } else {
//       funcToEnclosedFuncs.set(enclosingFunc, [func]);
//     }
//   });
//   funcToEnclosingFunc.forEach((enclosingFunc, func) => {
//     if (!funcToEnclosedFuncs.has(func)) {
//       funcToEnclosedFuncs.set(func, []);
//     }
//   });
// }

interface RewrittenFunction {
  name: string;
  func: ESTree.FunctionExpression | ESTree.Function;
}

function rewriteFunctionExpressions(program: ESTree.Program): ESTree.Program {
  // enclosingFunctions = new Array<string>();
  // enclosingFunctions.push('__main__');
  // funcToEnclosingFunc = new Map<string, string>();

  let functionIdGenerator = IdGenerator.create();
  let functionExpressionsToRewrite: RewrittenFunction[] = [];

  // We're making use of the built-in `JSON.stringify` method here
  // because it accepts a `replacer` callback as its second parameter.
  // That callback gets passed every key and value that's being stringified
  // and can return a different value that's included in the JSON string
  // instead of the original value.
  //
  // This is a poor man's AST visitor, if you will. The idea is that
  // we can easily detect every AST node of type `FunctionExpression` this way.
  // When we encounter such a function expression, we keep track of it
  // and replace the corresponding AST node by a new unique identifier.
  //
  // After the entire program has been visited, we prepend to the program body
  // a function declaration for every function expression we've encountered.
  let stringifiedProgram = JSON.stringify(program, visitNode);

  // The original program is not modified; instead, a clone is created
  let clonedProgram: ESTree.Program = JSON.parse(stringifiedProgram);

  prependFunctionDeclarationsToProgramBody(
    functionExpressionsToRewrite,
    clonedProgram
  );

  // createEnclosingFuncToFunc();

  return clonedProgram;

  // function visitNode(key: string, value: any): any {
  //   if (
  //     ESTree.isFunctionExpression(value) ||
  //     ESTree.isFunctionDeclaration(value)
  //   ) {
  //     return rewriteFunctions(value);
  //   }
  //   return value;
  // }

  function visitNode(key: string, value: any): any {
    return ESTree.isFunctionExpression(value) ? rewriteFunctions(value) : value;
  }

  function getRewrittenFuncName(expr): string {
    if (ESTree.isFunctionExpression(expr)) {
      let funcId = functionIdGenerator.generateId();
      let nameSuffix = expr.id ? '_' + expr.id.name : '';
      return `$$func${funcId}${nameSuffix}`;
    } else if (ESTree.isFunctionDeclaration(expr)) {
      return expr.id.name;
    }
  }

  function rewriteFunctions(
    func: ESTree.Function | ESTree.FunctionExpression
  ): ESTree.Identifier | ESTree.ExpressionStatement {
    let funcName = getRewrittenFuncName(func);

    // const enclosingFunction = getEnclosingFunction();
    // funcToEnclosingFunc.set(funcName, enclosingFunction);
    // enclosingFunctions.push(funcName);
    // logger.debug(`Pushed ${funcName}`);

    const stringifiedFunctionExpressionBody = JSON.stringify(
      func.body,
      visitNode
    );
    let rewrittenFunc = clone(func);
    rewrittenFunc.body = JSON.parse(stringifiedFunctionExpressionBody);

    functionExpressionsToRewrite.push({
      name: funcName,
      func: rewrittenFunc,
    });

    // enclosingFunctions.pop();
    // logger.debug(`Popped ${funcName}`);

    const returnId = <ESTree.Identifier>{
      type: ESTree.NodeType.Identifier,
      name: funcName,
    };

    if (ESTree.isFunctionExpression(func)) {
      return returnId;
    } else if (ESTree.isFunctionDeclaration(func)) {
      return <ESTree.ExpressionStatement>{
        type: ESTree.NodeType.ExpressionStatement,
        expression: returnId,
      };
    }
  }
}

function prependFunctionDeclarationsToProgramBody(
  rewrittenFunctions: RewrittenFunction[],
  program: ESTree.Program
) {
  for (let rewrittenFunc of rewrittenFunctions) {
    let functionDeclaration: ESTree.Function = {
      type: ESTree.NodeType.FunctionDeclaration,
      id: {
        type: ESTree.NodeType.Identifier,
        name: rewrittenFunc.name,
      },
      params: clone(rewrittenFunc.func.params),
      body: clone(rewrittenFunc.func.body),
    };

    program.body.unshift(functionDeclaration);
  }
}

function clone<T>(object: T): T {
  return JSON.parse(JSON.stringify(object));
}
