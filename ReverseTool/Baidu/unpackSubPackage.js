function unpackSubPackage(root) {
  const content = JSON.parse(fs.readFileSync(path.join(root, './app.json')).toString());
  const subPackages = content['subPackages'];
  if (subPackages) {
    console.log(`total subPackage: ${subPackages.length}`)
    let unpackNum = 0;
    for (const sub of subPackages) {
      const subDir = sub['root'];
      const subAppJsPath = path.resolve(root, subDir, './app.js');
      try {
        unpackJs(root, subAppJsPath);
        console.log(`[unpack subPackage] ${subDir} success`)
        unpackNum = unpackNum + 1;
      } catch (e) {
        console.log(`[unpack subPackage] can not find ${subDir} app.js`)
      }
    }
    console.log(`unpack subPackage success: ${unpackNum}`)
  }
}
