function unpackSwan(dir) {
  const getDirectories = function (src, callback) {
    // TODO allCusomComponents 这类型不能直接解析
    glob(src + '/**/*.swan.js', callback);
  };
  getDirectories(dir, function (err, res) {
    if (err) {
      console.log('Error', err);
    } else {
      res.forEach(file => {
        const content = fs.readFileSync(file).toString();
        const start = content.indexOf('template:') + 10;
        const end = content.indexOf(',isComponent:') - 1;
        let swan = content.substring(start, end);
        swan = swan.replace(/\\\'/g, '\'');
        swan = swan.replace(/\\\"/g, '"');
        swan = dealEvent(swan);
        swan = swanBeautify(swan);

        const filepath = file.substring(0, file.lastIndexOf('.js'));
        fs.writeFile(filepath, swan, (err) => {
          if (err) {
            console.log(`save ${filepath} fail`);
          } else {
            // console.log(`save ${filepath} success`)
            fs.rmSync(file);
          }
        });
      })
    }
  });

  function dealEvent(swan) {
    let dom = new JSDOM(swan);
    // console.log(dom.window.document.body.textContent)
    Array.from(dom.window.document.body.getElementsByTagName("*")).forEach(element => {
      Array.from(element.attributes).forEach(attribute => {
        try {
          if (attribute.name.startsWith('on-bind')) {
            let event = attribute.name.toString().substring(3);
            let handler = attribute.value.toString().split(',')[2].trim();
            element.setAttribute(event, handler);
            element.removeAttribute(attribute.name);
          }
        } catch (e) {
          console.log(e);
        }
      })
    });
    return dom.window.document.documentElement.outerHTML
  }
}
