const parser = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default

function myTraverse(code) {
  const MyVisitor = {
    FunctionDeclaration(path) {
      const paraMap = {
        "params.0": "require",
        "params.1": "module",
        "params.2": "exports",
        "params.3": "define",
        "params.4": "swan",
        "params.5": "getApp",
      }
      for (let key in paraMap) {
        const paramOldName = path.get(key)
        if (!paramOldName){
          continue
        }
        const paramNewName = paraMap[key]
        path.scope.rename(paramOldName.node.name, paramNewName)
      }
      path.stop();
    }
  }
  let ast = parser.parse(code);
  traverse(ast, MyVisitor);
  const output = generate(ast, {}, code);
  return output.code;
}

module.exports = {myTraverse: myTraverse};
if (require.main === module) {

  // let code = `function square(n) {
  //   return n * n;
  // }`
  let code = `
  function temp(n, e, t, o, i, a, s, r, u, d, c, l, g, _, m, p, b, f, w, h, I, v, x) {
  "use strict";

  
    Page({
      data: {
        userInfo: {},
        hasUserInfo: !1,
        canIUse: i.canIUse("button.open-type.getUserInfo")
      },
      onLoad: function () {},
      getUserInfo: function (n) {
        this.setData({
          userInfo: n.detail.userInfo,
          hasUserInfo: !0
        }), console.log(t(10));
      },
      navigateToSecondPage: function () {
        i.navigateTo({
          url: "/pages/page2/page2"
        });
      },
      navigateToDynamic: function () {
        i.navigateTo({
          url: "/pages/page3/page3"
        });
      },
      navigateToSubpackage: function () {
        console.log("dddd"), i.navigateTo({
          url: "/subpackage/pages/index/index"
        });
      }
    });

};
`
  code = myTraverse(code);
  console.log(code);
}

