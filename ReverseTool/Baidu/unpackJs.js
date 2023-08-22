function getHeadString(char) {
  let s = 'e.global, e.Function, e.setTimeout, e.setInterval, e.setImmediate, e.requestAnimationFrame, e.swanGlobal, e.jsNative, e.masterManager, e._openSourceDebugInfo, e.System, e.Bdbox_aiapps_jsbridge, e.Bdbox_android_jsbridge, e.Bdbox_android_utils, e._naFile, e._naInteraction, e._naNetwork, e._naRouter, e._naSetting, e._naStorage, e._naUtils, e.globalThis;'
  s = s.replace(/e\./g, char + '.');
  return s;
}

function getId2Name(content) {
  // TODO 正则和window.__swanRoute="app" 需要使用同样的引号
  // const s = content.substring(content.indexOf('window.__swanRoute=\'app\''))
  const s = content.substring(content.indexOf('window.__swanRoute="app"'))

  // console.log(s);

  const fileNameReg = /window.__swanRoute="(.*?)"/g;
  const fileNames = s.match(fileNameReg);
  const fileIdReg = /require\("(.*?)"\)/g;
  const fileIds = s.match(fileIdReg);

  const fileId2Name = {}
  console.assert(fileNames.length === fileIds.length, 'cannot get file id and name mapping');

  let i = 0
  for (; i < fileNames.length; i++) {
    fileId2Name[reg.exec(fileIds[i])] = reg.exec(fileNames[i])[0]
  }

  // console.log('[Unpacking Project File] total js files:' + i);
  // console.log(fileId2Name);
  return fileId2Name
}


/*
* 针对createPage，通过括号匹配的方式，提取page对应的定义
* */
function getEndIndex(code) {
  let str = '';
  const stack = [];
  for (let i = 0; i < code.length; i++) {
    const letter = code[i];
    str += letter;

    if (letter === '(') {
      stack.push(code[i]);
    } else if (letter === ')') {
      if (stack[stack.length - 1] === '(') {
        stack.splice(-1, 1);
        if (stack.length === 0) {
          return str;
        }
      } else {
        stack.push(letter)
      }
    }
  }
  throw 'can not find page or component definition'
}

function checkCreatePageOrComponent(code) {
  if (code.indexOf('createPage)({') > -1) {
    code = 'Page' + code.slice(code.indexOf("createPage)") + 11).trim();
    code = getEndIndex(code)
  } else if (code.indexOf('createComponent)({') > -1) {
    code = 'Component' + code.slice(code.indexOf("createComponent)") + 16).trim();
    code = getEndIndex(code)
  }
  return code;
}


function storeFile(filepath, code) {
  if (!fs.existsSync(path.dirname(filepath))) {
    fs.mkdirSync(path.dirname(filepath), {recursive: true});
  }
  try {
    fs.writeFileSync(filepath, code);
  } catch (e) {
    console.log(e)
    console.log(`save ${filepath} fail`);
  }
}

function unpackJs(root, appJsPath) {
  if (!fs.existsSync(appJsPath)) {
    throw 'can not find app.js'
  }
  const content = fs.readFileSync(appJsPath).toString();
  const fileId2Name = getId2Name(content);
  const start = `
    var define ;
    var window = window || {
        define : define
    };
    var define = window.define;
    var setTimeout = setTimeout || {};
    var setInterval = setInterval || {};
    var setImmediate = setImmediate || {};
    var eval = eval || {};
    var requestAnimationFrame = requestAnimationFrame || {};`

  const codestring = start + jsBeautify(content);

  const sandbox = {
    require() {
    },
    define(fileId, func) {
      let filename = fileId2Name[fileId.toString()];
      // some js file just know its id, but can not get its file path
      if (filename === undefined) {
        filename = fileId;
      }

      let code = func.toString();
      //storeFile(path.join(root, filename + '-temp.js'), code);
      code = myTraverse.myTraverse('function temp ' + code.slice(8));

      code = code.slice(code.indexOf("{") + 1, code.lastIndexOf("}") - 1).trim();
      if (code.startsWith('"use strict";')) {
        code = code.substring(13).trim();
      }
      if (code.startsWith('!function')) {
        code = code.slice(code.indexOf("{") + 1, code.lastIndexOf("}") - 1).trim();
        try {
          const arugment = code.match(/\([a-z]\)/)[0][1]
          code = code.replace(getHeadString(arugment), '').trim();
        }catch (e) {

        }
      }
      code = checkCreatePageOrComponent(code);

      storeFile(path.join(root, filename + '.js'), code);
    },
  }
  const vm = new VM({sandbox: sandbox});
  vm.run(codestring);
}
