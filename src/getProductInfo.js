const Apify = require('apify');

const { log } = Apify.utils;

async function getProductInfo(pageObj, pageData) {
    let productInfo;
    return productInfo;
}

async function scrapeProductInfo(pageObj, pageData ) {
    log.info("Scrapping product....");
    const product = await getProductInfo(pageObj, pageData);
    await Apify.pushData(product);
}

module.exports = { scrapeProductInfo };
