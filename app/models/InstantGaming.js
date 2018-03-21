const puppeteer = require('puppeteer');
const Scraper = require('./Scraper');

const GOTO_OPTIONS = { timeout: 0, waitUntil: 'domcontentloaded' };

class InstantGaming extends Scraper {

  constructor () {
    super();
    this.initialUrl = 'https://www.instant-gaming.com/es/busquedas/?all_types=1&all_cats=1&min_price=0&max_price=100&noprice=1&min_discount=0&max_discount=100&min_reviewsavg=10&max_reviewsavg=100&noreviews=1&available_in=ES&instock=1&gametype=all&sort_by=name_desc&query=';
  }

  async openBrowser () {
    this.browser = await puppeteer.launch();
  }

  async closeBrowser () {
    await this.browser.close();
    this.browser = null;
  }

  async getLinks (n = null) {
    const page = await this.browser.newPage();
    await page.goto(this.initialUrl, GOTO_OPTIONS);

    const links = await page.evaluate(() => {
      const links = [];
      const linksHtmlContainer = document.querySelectorAll('.pagination li a');
      if (!linksHtmlContainer || !linksHtmlContainer.length) {
        // TODO: send and log error, this class is broken, maybe InstantGaming structure has changed and html selectors must be recalculated
        return [];
      }

      linksHtmlContainer.forEach(item => links.push(item.href));

      return links;
    });

    this.links = [this.initialUrl, ...links];
    if (Number(n) && n >= 0) {
        this.links = this.links.slice(0, n);
    }
    await page.close();
  }

  async getProducts () {
    const links = this.links;
    const page = await this.browser.newPage();
    let products = [];

    for (let i=0; i<links.length; i++) {
      await page.goto(links[i], GOTO_OPTIONS);
      const pageScriptData = await page.evaluate(() => {
        // This is executed in the scope of the webpage:
        const data = {
          products: [],
          error: false,
        }

        // Functions definition:
        function getProductsInfo (htmlProducts) {
          const products = [];
          htmlProducts.forEach(item => {
            var currency = null;
            var selectedCurrency = document.querySelector('.ig-currency-selected');
            if (selectedCurrency) {
              var currencyItems = selectedCurrency.innerText.split(' ');
              if (currencyItems.length) currency = currencyItems[0].trim();
            }

            var price = typeof item.dataset !== 'undefined' && typeof item.dataset.price !== 'undefined' ? item.dataset.price : null;
            var region = typeof item.dataset !== 'undefined' && typeof item.dataset.region !== 'undefined' ? item.dataset.region : null;
            var link = null;
            var linkHtml = item.querySelector('.cover');
            if (linkHtml && typeof linkHtml.href === 'string') {
              link = linkHtml.href;
            }
            var image = null;
            var imageHtml = item.querySelector('.picture');
            if (imageHtml && typeof imageHtml.src === 'string') {
              image = imageHtml.src;
            }
            var discount = null;
            var discountElement = item.querySelector('.discount');
            if (discountElement && typeof discountElement.innerText !== 'undefined') {
              discount = discountElement.innerText;
            }
            var name = null;
            var nameHtml = item.querySelector('.name');
            if (nameHtml && typeof nameHtml.innerText === 'string') {
              name = nameHtml.innerText;
            }

            products.push({ name, price, discount, region, link, image, currency });
          });
          return products;
        }

        // Find products:
        const productHtmlElements = document.querySelectorAll('.search .item');
        if (!productHtmlElements || !productHtmlElements.length) {
          data.error = true;
          return data;
        }

        data.products = getProductsInfo(productHtmlElements);
        return data;
      });

      const error = pageScriptData.error;
      if (error) {
        // TODO: maybe InstantGaming structure has changed, log this and send notification to admin to check selectors
        console.error(`There was an error on scraping products on link ${links[i]}`);
      }
      const pageProducts = pageScriptData.products;
      console.log(`Scraping link ${i+1} / ${links.length}, found ${pageProducts.length} products`);
      this._sendProducts(pageProducts);
      products = [...products, ...pageProducts];
    }

    // End of scraping:
    this.products = products;
    await page.close();
  }

}

module.exports = InstantGaming;