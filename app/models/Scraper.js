const fs = require('fs');


class Scraper {

  constructor () {
    this.links = [];
    this.products = [];
    this.browser = null;
  }

  openBrowser () {}

  getLinks () {}

  getProducts () {}

  writeToFile (file, data, label = 'data') {
    const content = JSON.stringify(data, null, 2);
    fs.writeFile(file, content, 'utf8', err => {
      if (err) return console.log(`Error on writing links into ${file}. Error: ${err}`);
      console.log(`Success on writing ${label} into ${file}`);
    });
  }

}

module.exports = Scraper;