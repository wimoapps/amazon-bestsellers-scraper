const Apify = require('apify');

const { log } = Apify.utils;

async function getProducts(pageObj, pageData, resultsArr) {
    // Scrape all items that match the selector
    const itemsObj = await pageObj.$$eval('div.p13n-sc-truncated', prods => prods.map(prod => prod.innerHTML));
    const urlsObj = await pageObj.$$eval('span.aok-inline-block > a.a-link-normal', link => link.map(url => url.href));
    // Get rid of duplicate URLs (couldn't avoid scraping them)
    const urlsArr = [];
    for (const link of urlsObj) {
        if (!urlsArr.includes(link)) {
            urlsArr.push(link);
        }
    }

    // Add scraped items to results array
    for (let i = 0; i < Object.keys(itemsObj).length; i++) {
        resultsArr.push({
            ...pageData,
            url: urlsArr[i]
        });
    }
}

async function scrapeCategoryProducts(pageObj, pageData, requestQueue ) {
    const resultsArr = [];
    // Scrape page 1
    await getProducts(pageObj, pageData, resultsArr);
    // Go to page 2 and scrape
    let nextPage;
    try {
        nextPage = await pageObj.waitForSelector('li.a-last > a');
    } catch (e) {
        log.error(`Could not extract second page - only one page returned. ${e}`);
    }
    if (nextPage) {
        await nextPage.click();
        await pageObj.waitForNavigation();
        await getProducts(pageObj, pageData, resultsArr);
        resultsArr.forEach(item => {
            requestQueue.addRequest({
                url: item.url
            });
        });
        // await Apify.pushData(resultsArr);
        log.info(`Saving results from ${await pageObj.title()}`);
    }
}

module.exports = { scrapeCategoryProducts };
