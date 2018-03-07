const ScraperController = require('./app/controllers/ScraperController');
const { catchErrors } = require('./app/utils');


// Wrap async functions into error handler:
const scrap = catchErrors(ScraperController.scrap);

// Main:
(async () => {

  console.log(`Initializing E-Commerce Products Price Analyzer scraper`);

  await scrap();

  console.log(`End. Exiting script...`);

})();