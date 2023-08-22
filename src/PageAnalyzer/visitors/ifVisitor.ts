import { HtmlIfStmt } from '../htmlParser/fileInfo/ifStmt';
import * as parser from '@babel/parser';
import traverse, { NodePath, TraverseOptions } from '@babel/traverse';
import * as types from '@babel/types';
import { HtmlFileInfo } from '../htmlParser/fileInfo/htmlFileInfo';
import { Config } from '../../utils/config';
import { Page } from '../../utils/interface/miniProgram';
import { logger } from '../../utils/logHelper';

function rewriteCallExpr(path: NodePath<types.CallExpression>) {
  if (path.node.arguments.length === 0) {
    path.replaceWith(types.stringLiteral('__NOARGUMENT__'));
  } else if (path.node.arguments.length === 1) {
    path.replaceWith(path.node.arguments[0]);
  } else {
    let dummyLHS: types.Expression | types.PrivateName;
    if (types.isSpreadElement(path.node.arguments[0])) {
      dummyLHS = path.node.arguments[0].argument;
    } else {
      dummyLHS = <types.Expression>path.node.arguments[0];
    }
    for (let i = 1; i < path.node.arguments.length; ++i) {
      if (types.isArgumentPlaceholder(path.node.arguments[i])) continue;
      let dummyRHS: types.Expression;
      if (types.isSpreadElement(path.node.arguments[i])) {
        dummyRHS = (<types.SpreadElement>path.node.arguments[i]).argument;
      } else {
        dummyRHS = <types.Expression>path.node.arguments[i];
      }
      dummyLHS = types.binaryExpression('===', dummyLHS, dummyRHS);
    }
    path.replaceWith(dummyLHS);
  }
}

function rewriteIdentifier(
  path: NodePath<types.Identifier>,
  handlers: Array<string>
) {
  if (types.isMemberExpression(path.parentPath.node)) return;
  if (path.node.name !== 'this' && !handlers.includes(path.node.name)) {
    path.replaceWith(
      types.memberExpression(
        types.memberExpression(
          types.thisExpression(),
          types.identifier('data')
        ),
        types.identifier(path.node.name)
      )
    );
    path.skip();
  }
}

function rewriteIfTests(ifStatement: HtmlIfStmt) {
  /**
   * Rewrite the test expression in an if statement.
   * 1. Identifiers <id> are converted to this.data.<id>
   * 2. Call expr (from .wxs) are discarded,
   *    only parameters (from this.data) are retained.
   * 3. Handler functions are converted to __PageParam__.function
   *
   * @param {HtmlIfStmt} ifStatement - if stmt to be converted
   *
   * @returns {types.File} - an ast of the re-written if stmt
   */
  let handlers = ifStatement.getHandlers();
  let code = ifStatement.toJSCode();
  let ast = parser.parse(code);

  const rewriteConditionalTestVisitor: TraverseOptions<types.Node> = {
    CallExpression: function (path) {
      rewriteCallExpr(path);
    },
    Identifier: function (path) {
      rewriteIdentifier(path, handlers);
    },
  };

  const locateIfStmtTestVisitor: TraverseOptions<types.Node> = {
    IfStatement: function (path) {
      path.get('test').traverse(rewriteConditionalTestVisitor);

      if (types.isCallExpression(path.get('test').node)) {
        let testExpr = <NodePath<types.CallExpression>>path.get('test');
        rewriteCallExpr(testExpr);
      }
      if (types.isIdentifier(path.get('test').node)) {
        let testExpr = <NodePath<types.Identifier>>path.get('test');
        rewriteIdentifier(testExpr, handlers);
      }
    },
  };

  traverse(ast, locateIfStmtTestVisitor);

  return ast;
}

export function ifVisitorHelper(
  htmlFileInfo: HtmlFileInfo,
  path: NodePath,
  page: Page
): void {
  let id = 0;
  for (let ifStmt of htmlFileInfo.ifStmts) {
    let ifAST = rewriteIfTests(ifStmt);
    let dummyFunc = types.objectProperty(
      types.identifier(`$$DummyFunc${id++}`),
      types.functionExpression(
        null,
        [],
        types.blockStatement(ifAST.program.body)
      )
    );
    path.node = path.node as types.CallExpression;
    if (types.isObjectExpression(path.node.arguments[0])) {
      (path.node.arguments[0] as types.ObjectExpression).properties.push(
        dummyFunc
      );
    } else {
      logger.warn(
        `[Transpiler] In ${page.name} First argument of Page() is not an object.`
      );
      logger.warn(
        '[Transpiler] Trying to insert dummy functions into other arguments...'
      );
      for (let i = 1; i < path.node.arguments.length; ++i) {
        if (types.isObjectExpression(path.node.arguments[i])) {
          (<types.ObjectExpression>path.node.arguments[i]).properties.push(
            dummyFunc
          );
        }
      }
    }
  }
}
