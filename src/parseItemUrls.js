// The comment below makes sure that eslint ignores variables from inside
// of the webpage (eq. $ for jQuery and window)
/* global $ */
const Apify = require('apify');
const { getOriginUrl } = require('./utils');

const { log } = Apify.utils;

async function extractItemDetails($, request) {
    const originUrl = await getOriginUrl(request);
    const itemUrls = [];
    const items = $('span.aok-inline-block > a.a-link-normal');
    if (items.length !== 0) {
        items.each(function () {
            const url = $(this).attr('href');
            if(url){
                itemUrls.push({
                    url: "https://www.amazon.com/" + url
                });
            }
        });
    }else{
        log.info("items empty !!!")
    }
    return itemUrls;
}

async function parseItemUrls($, request) {
    const urls = await extractItemDetails($, request);
    const nextPage = await $('li.a-last > a');
    log.info("nextPage = ", nextPage);
    // if (nextPage) {
    //     await nextPage.click();
    //     await $.waitForNavigation();
    // }
    // const page_2_urls = await extractItemDetails($, request);
    log.info(`Found ${urls.length} on a site, going to crawl them. URL: ${request.url}`);
    return urls;// [...urls, ...page_2_urls];
}

module.exports = { parseItemUrls };
