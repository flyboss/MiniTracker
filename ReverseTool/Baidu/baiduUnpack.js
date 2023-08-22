const path = require("path");
const UglifyJS = require("uglify-es");
const {js_beautify} = require("js-beautify").js;
const beautify_html = require('js-beautify').html;
const {VM} = require('vm2');
const fs = require("fs")
const glob = require("glob");
const reg = /(?<=").*?(?=")/;
const csv = require('csv-parser');
const myTraverse = require('./myTraverse')
const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const fse = require('fs-extra');

function unpackPkg(packageName) {
  const sourceDir = path.join('D:\\baidu-mini-program(no unpack)\\', packageName);
  console.log(`unpacking ${sourceDir}`);
  const directories = fs.readdirSync(sourceDir);
  if (directories.length > 1) {
    throw 'find more than one version of the mini program!';
  }
  const targetDir = path.join('D:\\baidu-mini-program', packageName)
  if (fs.existsSync(targetDir)){
    fs.rmdirSync(targetDir,{recursive:true});
  }
  fse.copySync(sourceDir, targetDir)

  const root = path.join(targetDir, directories[0]);
  try {
    unpackJs(root, path.join(root, 'app.js'));
    unpackSwan(root);
    console.log(`[unpack masterPackage] success`)
    unpackSubPackage(root);
    console.log(`unpack ${root} success`)
  } catch (e) {
    console.log(e)
    console.log(`unpack ${root} fail`)
  }
}

function run() {
  unpackPkg(process.argv[2]);
}

module.exports = {run: run};
if (require.main === module) {
  run();
}



