const path = require('path');
const InstantGaming = require('../models/InstantGaming');
const G2A = require('../models/G2A');


const stores = [
  InstantGaming,
  G2A,
];

exports.scrap = async () => {

  for (let i=0; i<stores.length; i++) {
    const store = new stores[i]();
    const instanceName = stores[i].prototype.constructor.name;
    console.log(`Instance of ${instanceName}`);

    await store.openBrowser();

    await store.getLinks();
    console.log(`Links: ${store.links.length}`);

    await store.getProducts();
    console.log(`Products: ${store.products.length}`)

    await store.closeBrowser();

    const linksFile = path.join(__dirname, '..', 'data', `${instanceName}_links.json`);
    const productsFile = path.join(__dirname, '..', 'data', `${instanceName}_products.json`)
    store.writeToFile(linksFile, store.links, 'links');
    store.writeToFile(productsFile, store.products, 'products');
  }

}