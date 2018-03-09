const fs = require('fs');
const axios = require('axios');
require('dotenv').config();


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

  async sendProducts () {
    const products = this.products;
    const url = process.env.API_PRODUCTS_URL || null;
    if (!url) {
      console.error(`You have to define API_PRODUCTS_URL in .env config file, where API_PRODUCTS_URL is the complete url of the API where products have to be sent`);
      process.exit();
    }
    if (!this.products.length) {
      return console.error(`There are no products to be sent`);
    }

    axios.post(url, { products })
    .then(response => {
      // TODO:  check response:
      console.log(`Sent products to ${url}`);
    })
    .catch(error => {
      console.error(`ERROR on sending products: ${error.message}`);
    });
  }

}

module.exports = Scraper;