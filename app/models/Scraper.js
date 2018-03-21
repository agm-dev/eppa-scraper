const fs = require('fs');
const axios = require('axios');
require('dotenv').config();


class Scraper {

  constructor () {
    this.links = [];
    this.products = [];
    this.browser = null;
    this.REQUEST_ID_LENGTH = (typeof process.env.REQUEST_ID_LENGTH !== 'undefined') ? parseInt(process.env.REQUEST_ID_LENGTH) : 100;
    this.MAX_NUM_PRODUCTS_PER_REQUEST = (typeof process.env.MAX_NUM_PRODUCTS_PER_REQUEST !== 'undefined') ? parseInt(process.env.MAX_NUM_PRODUCTS_PER_REQUEST) : 100;
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

  _genRequestId (l) {
    l = l || 100;
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i=0; i<l; i++) {
      let randomIndex = Math.floor(Math.random() * chars.length);
      let uppercase = Math.round(Math.random());
      let char = (uppercase > 0) ? chars.split('')[randomIndex].toUpperCase() : chars.split('')[randomIndex];
      result += char;
    }
    return result;
  }

  _sendProducts (products) {
    products = products || [];
    const url = process.env.API_PRODUCTS_URL || null;
    const client_id = process.env.CLIENT_ID || null;
    if (!url) {
      console.error(`You have to define API_PRODUCTS_URL in .env config file, where API_PRODUCTS_URL is the complete url of the API where products have to be sent`);
      process.exit();
    }
    if (!client_id) {
      console.error(`You have to define CLIENT_ID in .env config file to be identified by the api`);
    }
    if (!products.length) {
      return console.error(`There are no products to be sent`);
    }

    // split products in N requests
    const maxProducts = this.MAX_NUM_PRODUCTS_PER_REQUEST;
    let requests = [];
    for (let i=0; i<products.length; i=i+maxProducts) {
      console.log(`iteration. i: ${i}, end: ${i+maxProducts}, maxProducts: ${maxProducts}`);
      const request = axios.post(url, {
        products: products.slice(i, i + maxProducts),
        client_id,
        request_id: this._genRequestId(this.REQUEST_ID_LENGTH),
      });
      requests.push(request);
    }

    // send the requests:
    axios.all(requests)
    .then(results => {
      console.log(`finished sending requests`);
      console.log(`got ${results.length} responses`);
      const errors = results.filter(r => r.status !== 201);
      const oks = results.filter(r => r.status === 201);
      console.log(`${errors.length} errors, ${oks.length} success`);
      results.map(r => console.log(`${JSON.stringify(r.data)}`));
    }).catch(error => {
      console.log(`error on axios.all: ${err.message}`);
    });

  }

}

module.exports = Scraper;