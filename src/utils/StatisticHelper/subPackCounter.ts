import * as path from 'path';
import * as fs from 'fs';
import * as csvparse from 'csv-parse/lib/sync';
import { createObjectCsvWriter } from 'csv-writer';

let percentage:number = 0.0;
function getSubpackage(detail) {
  const root = 'D:\\baidu-mini-program(no unpack)';
  let filepath = path.join(root, detail['name']);
  filepath = path.join(filepath, fs.readdirSync(filepath)[0]);
  const content = JSON.parse(
    fs.readFileSync(path.join(filepath, './app.json')).toString()
  );
  detail['pageNum'] = detail['pageDownload'] = content['pages'].length;
  detail['subpackageDownload'] = detail['subpackageNum'] = 0;

  const subPackages = content['subPackages'];
  if (subPackages === void 0) {
    console.log(detail['name']);
  } else {
    detail['subpackageNum'] = subPackages.length;
    for (const sub of subPackages) {
      detail['pageNum'] += sub['pages'].length;
      const subDir = sub['root'];
      const subAppJsPath = path.resolve(filepath, subDir, './app.js');
      if (fs.existsSync(subAppJsPath)) {
        detail['subpackageDownload']++;
        detail['pageDownload'] += sub['pages'].length;
      }
    }
  }
  detail['subpackageNotDownload'] =
    detail['subpackageNum'] - detail['subpackageDownload'];
  percentage += Number(detail['pageDownload'] / detail['pageNum']*100)
  detail['pageDownload(pct)'] = Number(detail['pageDownload'] / detail['pageNum']*100).toFixed(2).toString()+'%'
  return detail;
}

function update() {
  const csvFilepath = path.join(
    __dirname,
    '../../../statistic/baidu-mini-program-detail.csv'
  );
  const input = fs.readFileSync(csvFilepath).toString();
  let details = csvparse(input, {
    columns: true,
    skip_empty_lines: true,
  });

  details = details.map((detail) => {
    return getSubpackage(detail);
  });
  details = details.sort(function (a, b) {
    return b['unDownloadSubPack'] - a['unDownloadSubPack'];
  });
  percentage = percentage/details.length;
  console.log(`The number of downloaded pages accounts for ${percentage} of the total number of pages`)
  let pageNum=0,pageDownload=0 ;
  details.filter(detail =>{
    pageNum+=detail['pageNum'];
    pageDownload += detail['pageDownload'];
  })
  console.log(`${pageDownload/pageNum*100}`);
  let csvWriter = createObjectCsvWriter({
    path: csvFilepath,
    header: [
      { id: 'name', title: 'name' },
      { id: 'packageName', title: 'packageName' },
      { id: 'isTaro', title: 'isTaro' },
      { id: 'subpackageNum', title: 'subpackageNum' },
      { id: 'subpackageDownload', title: 'subpackageDownload' },
      { id: 'subpackageNotDownload', title: 'subpackageNotDownload' },
      { id: 'subpackageNote', title: 'subpackageNote' },
      { id: 'pageNum', title: 'pageNum' },
      { id: 'pageDownload', title: 'pageDownload' },
      { id: 'pageDownload(pct)', title: 'pageDownload(pct)' },
      { id: 'analysisNote', title: 'analysisNote' },
    ],
  });
  csvWriter.writeRecords(details).then(() => {
    console.log('...Done');
  }).catch(e=>{
    console.log(e)
  });
}

if (require.main === module) {
  update();
}
