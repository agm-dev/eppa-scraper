const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth')
const Scraper = require('./Scraper');

puppeteer.use(pluginStealth());

// FIX: as this is the same option used in other classes, place it into external puppeteer constants file or config file
//const GOTO_OPTIONS = { timeout: 0, waitUntil: 'domcontentloaded' }
const GOTO_OPTIONS = { timeout: 0, waitUntil: 'networkidle0' }

class G2A extends Scraper {

  constructor () {
    super()
    this.initialUrl = 'https://www.g2a.com/es-es/search?category_id=gaming&page=1&platform=1&sort=newest-first';
    this.expectedProducts = 0;
  }

  // FIX: check if this can be done in parent class
  async openBrowser () {
    this.browser = await puppeteer.launch({ headless: true });
  }

  // FIX: check if this can be done in parent class
  async closeBrowser () {
    await this.browser.close();
    this.browser = null;
  }

  _generateLinks (n) {
    return [...Array(n)].reduce((links, value, index) => {
      const page = `page=${index+1}`;
      const newLink = this.initialUrl.replace('page=1', page);
      return [...links, newLink];
    }, []);
  }

  async getLinks (n = null) {
    // Create and goto initial url, entry point to start scraping links and products:
    const page = await this.browser.newPage();
    await page.goto(this.initialUrl, GOTO_OPTIONS);

    const data = await page.evaluate(() => {
      // This function is evaluated in webpage scope:
      const data = {};

      // Get expected results:
      const queryResultsHtml = document.querySelector('.listing-header__query-results span span');

      if (!queryResultsHtml || typeof queryResultsHtml.innerText !== 'string' || !queryResultsHtml.innerText.length || queryResultsHtml.innerText.split(' ').length < 1 || isNaN(Number(queryResultsHtml.innerText.split(' ')[0]))) {
        // TODO: send and log error, this class is broken and maybe G2A has changed HTML structure.
        data.queryResults = { error: true, value: 0 };
      } else {
        const results = parseInt(queryResultsHtml.innerText.split(' ')[0]);
        data.queryResults = { error: false, value: results };
      }

      // Get number of pages:
      const nPagesHtml = document.querySelector('.pagination__translation');
      if (!nPagesHtml || typeof nPagesHtml.innerText !== 'string' || !nPagesHtml.innerText.length) {
        // TODO: send and log error, this class is broken and maybe G2A has changed HTML structure.
        data.links = { error: true, value: 0 };
      } else {
        const pagesText = nPagesHtml.innerText;
        const pagesTextItems = pagesText.split('/');
        if (pagesTextItems.length < 2 || isNaN(Number(pagesTextItems[1].trim()))) {
          // TODO: log
          data.links = { error: true, value: 0 };
        } else {
          // We can't generate links array here because we don't have access to initialUrl unless you get it from location.href
          const nPages = parseInt(pagesTextItems[1].trim());
          data.links = { error: false, value: nPages };
        }
      }

      // Return data:
      return data;
    });

    // Check data from browser: query results is the number of total products found by the query (full total, not only in this page)
    if (data.queryResults.error) {
      // TODO: log error on get DOM value for found resulst
    }
    this.expectedProducts = data.queryResults.value;

    if (data.links.error) {
      // TODO: log error on get DOM links
    }
    this.links = this._generateLinks(data.links.value);

    if (Number(n) && n >= 0) {
      this.expectedProducts = 0; // if this value is 0, total scraped products won't be validated against this value
      this.links = this.links.slice(0, n);
    }
    await page.close();
  }

  async getProducts () {
    const links = this.links;
    console.log(links.length);
    const page = await this.browser.newPage();
    let products = [];

    for (let i=0; i<links.length; i++) {
      await page.goto(links[i], GOTO_OPTIONS);
      const pageScriptData = await page.evaluate(() => {
        // This block is executed in scope of webpage:
        var platform = 'steam';
        var region = 'global';

        var data = {
            error: false,
            products: [],
        };

        var productsHtml = document.querySelectorAll('.products .Card__base');
        if (!productsHtml) {
            data.error = true;
            return data;
        }

        var productsData = [];
        productsHtml.forEach(item => {
            var productData = {
                link: '',
                image: '',
                name: '',
                price: '',
                currency: 'EUR',
                preorder: false,
            };

            var link = item.querySelector('.Card__media a');
            if (link && typeof link.href === 'string') {
                productData.link = link.href.trim();
            }
            var image = item.querySelector('.Card__cover .lazy-image__img');
            if (image && typeof image.src === 'string') {
                productData.image = image.src.trim();
            }

            var name = item.querySelector('.Card__body .Card__title a');
            if (name && typeof name.innerText === 'string') {
                productData.name = name.innerText.trim();
            }

            var price = item.querySelector('.Card__body .Card__price-cost');
            if (price && typeof price.innerText === 'string' && price.innerText.split(' ').length) {
                var priceData = price.innerText.split(' ');
                productData.price = parseFloat(priceData[0]);
                if (priceData.length > 1 && priceData[1].trim() !== productData.currency) {
                    productData.currency = priceData[1].trim();
                }

            }

            var preorder = (item.querySelector('.Card__ribbon')) ? true : false;
            if (preorder) {
                productData.preorder = true;
            }

            // Filter product by platform and region using its name data:
            /**
             * This is added to discard some results, as we handle
             * more than 10k results. This will avoid the total number
             * of results matches the search founded :/ should I
             * remove this and do it later?
             */
            var matchRegion = (region === 'global') ? 'GLOBAL' : region.toUpperCase();
            var productMatchesPlatform = productData.name.toLowerCase().indexOf(platform) !== -1;
            var productMatchesRegion = productData.name.indexOf(matchRegion) !== -1;
            if (productMatchesRegion && productMatchesPlatform) {
                productsData.push(productData);
            }
        });

        data.products = productsData;
        return data;
      });

      // Check data:
      if (pageScriptData.error) {
        // TODO: log error, maybe the html structure from G2A has changed.
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

module.exports = G2A;