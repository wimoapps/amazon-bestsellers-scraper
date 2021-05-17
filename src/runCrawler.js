const Apify = require('apify');
const parseSellerDetail = require('./parseSellerDetail');
const { parseItemUrls } = require('./parseItemUrls');
const parsePaginationUrl = require('./parsePaginationUrl');
const { saveItem, getOriginUrl } = require('./utils');
const detailParser = require('./parseItemDetail');
const { parseItemReviews } = require('./parseItemReviews');
const { log } = Apify.utils;
async function runCrawler(params) {
    const {$, session, request, requestQueue, input, getReviews, env} = params;
    request.userData.maxReviews = input.maxReviews;
    const { label } = request.userData;
    // log.info($('#nav-global-location-slot').text())
    const urlOrigin = await getOriginUrl(request);

    log.info(" label = " + label);

    if (!label || label === 'page') {
        try {
            const items = await parseItemUrls($, request);
            for (const item of items) {
                await requestQueue.addRequest({
                    url: item.url,
                    userData: {
                        label: 'detail',
                        asin: item.asin,
                        detailUrl: item.detailUrl,
                        sellerUrl: item.sellerUrl,
                        reviewsUrl: item.reviewsUrl
                    },
                }, { forefront: true });
            }

            if (items.length === 0) {
                await Apify.pushData({
                    status: 'No items for this category.',
                    url: request.url,
                });
            }
        } catch (error) {
            await Apify.pushData({
                status: 'No items for this category.',
                url: request.url
            });
        }
        // extract info about item and about seller offers
    } else if (label === 'detail') {
        try {
            const item = await detailParser($, request, requestQueue, getReviews);
            await saveItem('RESULT', request, item, input, env.defaultDatasetId, session);
        } catch (e) {
            log.error('Detail parsing failed', e);
        }
    } else if (label === 'reviews') {
        try {
            await parseItemReviews($, request, requestQueue);
        } catch (e) {
            log.error('Reviews parsing failed', e);
        }
    } else if (label === 'seller') {
        try {
            const item = await parseSellerDetail($, request);
            if (item) {
                let paginationUrlSeller;
                const paginationEle = $('ul.a-pagination li.a-last a');
                if (paginationEle.length !== 0) {
                    paginationUrlSeller = urlOrigin + paginationEle.attr('href');
                } else {
                    paginationUrlSeller = false;
                }

                // if there is a pagination, go to another page
                if (paginationUrlSeller !== false) {
                    log.info(`Seller detail has pagination, crawling that now -> ${paginationUrlSeller}`);
                    await requestQueue.addRequest({
                        url: paginationUrlSeller,
                        userData: {
                            label: 'seller',
                            itemDetail: request.userData.itemDetail,
                            keyword: request.userData.keyword,
                            asin: request.userData.asin,
                            detailUrl: request.userData.detailUrl,
                            sellerUrl: request.userData.sellerUrl,
                            sellers: item.sellers,
                        },
                    }, { forefront: true });
                }
                else {
                    const resultItem = input.reviews === "no" ? delete item.reviews : item;
                    log.info(`Saving item url: ${request.url}`);
                    await saveItem('RESULT', request, item, input, env.defaultDatasetId, session);
                }
            }
        } catch (error) {
            console.error(error);
            await saveItem('NORESULT', request, null, input, env.defaultDatasetId);
        }
    }
}

module.exports = runCrawler;
