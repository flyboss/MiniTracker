const fs = require("fs");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const csvWriter = createCsvWriter({
    path: '.\\statistic\\wechat-statistics.csv',
    header: [
        { id: 'miniProgramId', title: 'mini program id' },
        { id: 'versionId', title: 'version id' },
        { id: 'chineseName', title: 'Chinese Name' },
        { id: 'packageDownloadNum', title: 'package(download)' },
        { id: 'packageNum', title: 'package(total)' },
        { id: 'packagePct', title: 'package(pct)' },
        { id: 'pageDownloadNum', title: 'page(download)' },
        { id: 'pageNum', title: 'page(total)' },
        { id: 'pagePct', title: 'page(pct)' },
        { id: 'jsLoc', title: 'JS Loc' },
    ]
})
const { readJSONSync } = require("fs-extra");
const csvParse = require("csv-parse")

var rootpath = "..\\wxpkgs-备份";
let dataArray = [];
var test = fs.readdir(rootpath, function (err, files) {
    if (err) {
        return console.log(err);
    }

    files.forEach(function (file) {
        fs.readdir(rootpath + "\\" + file, function (err, files) {
            if (err) {
                return console.log(err);
            }
            var mainPath = "";
            var mainPathRaw = "";
            var data = {
                miniProgramId: '',
                versionId: '',
                chineseName: file,
                packageDownloadNum: 0,
                packageNum: 0,
                packagePct: 0.0,
                pageDownloadNum: 0,
                pageNum: 0,
                pagePct: 0.0,
                jsLoc: 0
            };
            // 查找主包路径
            try {
                files.forEach(function (fileb) {
                    if (fileb.substr(fileb.length - 7, 7) !== ".wxapkg" && fileb.substr(fileb.length - 5, 5) !== ".diff") {
                        // 判断主包
                        if (fs.existsSync(rootpath + "\\" + file + "\\" + fileb + "\\app.json")) {
                            mainPath = rootpath + "\\" + file + "\\" + fileb;
                            mainPathRaw = fileb;
                            // 提取id
                            ind = fileb.indexOf("_", 1);
                            miniProgramId = fileb.substr(1, ind - 1);
                            versionId = fileb.substr(ind + 1, fileb.length - ind - 1);
                            data.miniProgramId = miniProgramId;
                            data.versionId = versionId;
                            throw new Error("已找到主包路径！")
                        }
                    }
                })
            } catch (e) {
                if (e.message !== "已找到主包路径！") throw e;
            }
            // todo: 解析app.json, 计算总page数和子包数
            var appJson = fs.readFileSync(mainPath + "\\app.json");
            appJson = JSON.parse(appJson);
            var subPackages = appJson.subPackages;
            var subPackageNum = 0;
            var mainPages = appJson.pages;
            var pageNum = mainPages.length;
            if (typeof (subPackages) != "undefined") {
                subPackageNum = subPackages.length;
                subPackages.forEach(function (subPackage) {
                    pageNum += subPackage.pages.length;
                });
            }
            data.packageNum = subPackageNum;
            data.pageNum = pageNum;
            // console.log(appJson.subPackages);
            // 检查子包路径匹配的subpackage, 计算下载下来的page数和子包数
            var pageDownloadNum = mainPages.length;
            var subPackageDownloadNum = 0;
            files.forEach(function (fileb) {
                if (fileb.substr(fileb.length - 7, 7) !== ".wxapkg" && fileb.substr(fileb.length - 5, 5) !== ".diff" && fileb != mainPathRaw) {
                    subPackagePath = rootpath + "\\" + file + "\\" + fileb + "\\";
                    for (var i = 0; i < subPackages.length; ++i) {
                        tmpForDebug = subPackagePath + subPackages[i].root.replace(/\//g, "\\");
                        if (fs.existsSync(subPackagePath + subPackages[i].root.replace(/\//g, "\\"))) {
                            pageDownloadNum += subPackages[i].pages.length;
                            subPackageDownloadNum++;
                        }
                    }
                }
            })
            data.packageDownloadNum = subPackageDownloadNum;
            data.pageDownloadNum = pageDownloadNum;
            data.pagePct = pageDownloadNum * 100.0 / pageNum;
            if (subPackageNum !== 0) data.packagePct = subPackageDownloadNum * 100.0 / subPackageNum;
            else data.packagePct = 100;
            // 统计js loc
            srcDir = rootpath + "\\" + file;
            var codesFiles = ['.js'];
            var LINES = 0
            var findFolder = function (srcDir, cb) {
                fs.readdir(srcDir, function (err, files) {
                    var count = 0
                    var checkEnd = function () {
                        ++count == files.length && cb && cb()
                    }
                    if (err) {
                        checkEnd()
                        return
                    }
                    files.forEach(function (file) {
                        var extname = path.extname(file).toLowerCase()
                        var srcPath = path.join(srcDir, file)
                        fs.stat(srcPath, function (err, stats) {
                            if (stats.isDirectory()) {
                                findFolder(srcPath, checkEnd)
                            } else {
                                if (codesFiles.indexOf(extname) < 0) {
                                    checkEnd()
                                    return
                                }
                                fs.readFile(srcPath, function (err, data) {
                                    if (err) {
                                        checkEnd()
                                        return
                                    }
                                    var lines = data.toString().split('\n')
                                    LINES += lines.length
                                    checkEnd()
                                })
                            }
                        })
                    })
                    //为空时直接回调
                    files.length === 0 && cb && cb()
                })
            }
            findFolder(srcDir, function () {
                console.log(LINES);
                data.jsLoc = LINES;
                dataArray.push(data);
                csvWriter.writeRecords(dataArray);
            })
        })
    });
});
