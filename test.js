const path = require('path');
const G2A = require('./app/models/G2A');
const InstantGaming = require('./app/models/InstantGaming');
require('dotenv').config();


(async () => {
  //const store = new G2A();
  const store = new InstantGaming();
  const instanceName = 'InstantGaming';
  await store.openBrowser();
  await store.getLinks(1);
  console.log(`links: ${store.links.length}`);
  await store.getProducts();
  console.log(`products: ${store.products.length}`)
  const productString = JSON.stringify(store.products[0], null, 2);
  console.log(`Example product: ${productString}`);
  await store.closeBrowser();
  const linksFile = path.join(__dirname, 'app', 'data', `${instanceName}_links.json`);
  const productsFile = path.join(__dirname, 'app', 'data', `${instanceName}_products.json`)
  store.writeToFile(linksFile, store.links, 'links');
  store.writeToFile(productsFile, store.products, 'products');
  await store.sendProducts();
})();