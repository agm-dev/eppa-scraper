const puppeteer = require('puppeteer');
const Scraper = require('./Scraper');

// FIX: as this is the same option used in other classes, place it into external puppeteer constants file or config file
const GOTO_OPTIONS = { timeout: 0, waitUntil: 'domcontentloaded' }

class G2A extends Scraper {

  constructor () {
    super()
    this.initialUrl = 'https://www.g2a.com/es-es/search?category_id=gaming&page=1&platform=1&sort=newest-first';
    this.expectedProducts = 0;
  }

  // FIX: check if this can be done in parent class
  async openBrowser () {
    this.browser = await puppeteer.launch();
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
      const nPagesHtml = document.querySelector('.pagination-page');
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

  }

}

module.exports = G2A;

/**
 * NOTES:
 * It seems g2a search returns much more results that
 * instant gaming, but bad quality ones
 * - get all products from original links (around 14.000 products)
 * - filter that products by GLOBAL in name
 * - loop over those products, goto their link, then
 * extract some info only included in their product page:
 * platform, region, release date
 *
 * dom data:
 * const productsHtml = document.querySelectorAll('.products .Card__base');
 * forEach(item => ...)
 * const link = item.querySelector('.Card__media a').href;
 * const image = item.querySelector('.Card__cover .Card__img--placeholder').src
 * const name = item.querySelector('.Card__body .Card__title a').innerText;
 * const price = item.querySelector('.Card__body .Card__price-cost').innerText.split(' ')[0];
 * const currency = item.querySelector('.Card__body .Card__price-cost');
 * const preorder = (item.querySelector('.Card__ribbon')) ? true : false;
 *
 * const discount = null;
 *
 * once inside product page (link):
 *
 * const dataHtmlItems = document.querySelectorAll('.product__details-container__description .product-tags li')
 *
 * loop over them:
 * const region = (item.querySelector('.label').innerText === 'Plataforma') ? item.querySelector('strong').innerText;
 * const platform = (item.querySelector('.label').innerText === 'Región') ? item.querySelector('strong').innerText;
 * (only if preorder) const releaseDate = document.querySelector('.product__details__release-date strong').innerText
 */