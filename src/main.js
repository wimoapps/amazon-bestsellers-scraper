const Apify = require("apify");
const cheerio = require("cheerio");

const { log } = Apify.utils;
const runCrawler = require('./runCrawler');

const { sleep } = Apify.utils;

Apify.main(async () => {
    // const requestQueueForProductDetail = await Apify.openRequestQueue();
    // const requestQueueForProductList = await Apify.openRequestQueue();
    // const input = await Apify.getValue('INPUT');

    // const { proxy, domain, categoryUrls, depthOfCrawl } = input;

    // const requestList = await Apify.openRequestList(
    //     "my-request-list",
    //     categoryUrls
    // );

    // const requestQueue = await Apify.openRequestQueue();

    // const preNavigationHooks = [
    //     async (crawlingContext) => {
    //     },
    // ];

    // // const proxyConfiguration = await Apify.createProxyConfiguration(proxy);

    // const productListCrawler = new Apify.PuppeteerCrawler({
    //     requestList,
    //     requestQueue,
    //     useSessionPool: true,
    //     persistCookiesPerSession: true,
    //     preNavigationHooks,
    //     handlePageFunction: async ({ request, page, response, session }) => {
    //         log.info("handlePageFunction")
    //         // get and log category name
    //         const title = await page.title();
    //         const statusCode = await response.status();
    //         log.info(`Processing: ${title}. Depth: ${request.userData.depthOfCrawl},`
    //             + `is detail page: ${request.userData.detailPage} URL: ${request.url}`);

    //         const pageData = { category: title, categoryUrl: request.url };

    //         // Loading cheerio for easy parsing, remove if you wish
    //         const html = await page.content();
    //         const $ = cheerio.load(html);

    //         // We handle this separately to get info
    //         if ($('[action="/errors/validateCaptcha"]').length > 0) {
    //             session.retire();
    //             throw `[CAPTCHA]: Status Code: ${response.statusCode}`;
    //         }

    //         if (html.toLowerCase().includes('robot check')) {
    //             session.retire();
    //             throw `[ROBOT CHECK]: Status Code: ${response.statusCode}.`;
    //         }

    //         if (!response || (statusCode !== 200 && statusCode !== 404)) {
    //             session.retire();
    //             throw `[Status code: ${statusCode}]. Retrying`;
    //         }

    //         // Enqueue main category pages on the Best Sellers homepage
    //         if (!request.userData.detailPage) {
    //             await enqueueLinks({
    //                 page,
    //                 requestQueue,
    //                 selector: 'div > ul > ul > li > a',
    //                 transformRequestFunction: (req) => {
    //                     req.userData.detailPage = true;
    //                     req.userData.depthOfCrawl = 1;
    //                     return req;
    //                 },
    //             });
    //         }

    //         // Enqueue second subcategory level
    //         if (depthOfCrawl > 1 && request.userData.depthOfCrawl === 1) {
    //             await enqueueLinks({
    //                 page,
    //                 requestQueue,
    //                 selector: 'ul > ul > ul > li > a',
    //                 transformRequestFunction: (req) => {
    //                     req.userData.detailPage = true;
    //                     req.userData.depthOfCrawl = 2;
    //                     return req;
    //                 },
    //             });
    //         }

    //         // Log number of pending URLs (works only locally)
    //         // log.info(`Pending URLs: ${requestQueue.pendingCount}`);

    //         // Scrape items from enqueued pages
    //         if (request.userData.detailPage) {
    //             await scrapeCategoryProducts(page, pageData, requestQueueForProductDetail);
    //         }
    //     },
    //     handleFailedRequestFunction: async ({ request }) => {
    //         // This function is called when the crawling of a request failed too many times
    //         log.info("FAILED ======= ", request.errorMessages);
    //         await Apify.pushData({
    //             url: request.url,
    //             succeeded: false,
    //             errors: request.errorMessages,
    //         });
    //     },
    // });

    // const productDetailCrawler = new Apify.CheerioCrawler({
    //     maxRequestRetries: 15,
    //     maxConcurrency: 10, // To prevent too many browser activity
    //     requestQueue: requestQueueForProductDetail,
    //     useSessionPool: true,
    //     handlePageFunction: async ({ request, page, response, session }) => {
    //         // get and log category name
    //         const title = await page.title();
    //         const statusCode = await response.status();
    //         log.info(`Processing Product Details: ${title}.,`
    //             + `is detail page: ${request.userData.detailPage} URL: ${request.url}`);

    //         const pageData = { category: title, categoryUrl: request.url };

    //         // Loading cheerio for easy parsing, remove if you wish
    //         const html = await page.content();
    //         const $ = cheerio.load(html);

    //         // We handle this separately to get info
    //         if ($('[action="/errors/validateCaptcha"]').length > 0) {
    //             session.retire();
    //             throw `[CAPTCHA]: Status Code: ${response.statusCode}`;
    //         }

    //         if (html.toLowerCase().includes('robot check')) {
    //             session.retire();
    //             throw `[ROBOT CHECK]: Status Code: ${response.statusCode}.`;
    //         }

    //         if (!response || (statusCode !== 200 && statusCode !== 404)) {
    //             session.retire();
    //             throw `[Status code: ${statusCode}]. Retrying`;
    //         }

    //         // Enqueue main category pages on the Best Sellers homepage
    //         if (!request.userData.detailPage) {
    //             await enqueueLinks({
    //                 page,
    //                 requestQueue,
    //                 selector: 'div > ul > ul > li > a',
    //                 transformRequestFunction: (req) => {
    //                     req.userData.detailPage = true;
    //                     req.userData.depthOfCrawl = 1;
    //                     return req;
    //                 },
    //             });
    //         }

    //         // Log number of pending URLs (works only locally)
    //         // log.info(`Pending URLs: ${requestQueue.pendingCount}`);

    //         // Scrape items from enqueued pages
    //         if (request.userData.detailPage) {
    //             await scrapeProductInfo(page, pageData);
    //         }
    //     },
    // });

    // Get queue and enqueue first url.
    const requestQueue = await Apify.openRequestQueue();
    const input = await Apify.getValue("INPUT");
    const env = await Apify.getEnv();
    const { proxy, categoryUrls, maxResults, maxReviews } = input;
    let getReviews = false;
    if (maxReviews && maxReviews > 0) {
        getReviews = true;
    }
    for (const categoryUrl of categoryUrls) {
        console.log(categoryUrl.url);
        await requestQueue.addRequest(categoryUrl);
    }
    // const proxyConfiguration = await Apify.createProxyConfiguration(proxy);

    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,
        // proxyConfiguration,
        launchContext:{
            useChrome: true,
            launchOptions: {
                headless: true,
                slowMo: Apify.isAtHome() ? 100 : undefined,
            }
        },
        useSessionPool: true,
        sessionPoolOptions: {
            maxPoolSize: 30,
            persistStateKeyValueStoreId: "amazon-sessions",
            sessionOptions: {
                maxUsageCount: 50,
            },
        },
        maxConcurrency: input.maxConcurrency || 5,
        handlePageTimeoutSecs: 2.5 * 60,
        handleRequestTimeoutSecs: 60,
        persistCookiesPerSession: true,
        handlePageFunction: async ({ page, request, session }) => {
            const {
                url,
                userData,
                userData: { label },
            } = request;
            try {
                await sleep(3000);
                await page.waitForSelector("#a-popover-root");
            } catch (e) {
                await sleep(10000);
                await page.waitForSelector("body");
            }
            if (input.deliver !== "") {
                const cookies = JSON.parse(JSON.stringify(session.cookieJar))[
                    "cookies"
                ];
                const cookie = cookies.find((x) => x.key === "sp-cdn");
                const deliverCountry = input.delivery.split(",");
                const code = deliverCountry[0];
                if (!cookie || cookie.value !== `"L5Z9:${code}"`) {
                    const deliveryCode = deliverCountry[1];
                    try {
                        try {
                            await page.waitForSelector(
                                "#nav-global-location-slot #glow-ingress-line2"
                            );
                            await page.click(
                                "#nav-global-location-slot #glow-ingress-line2"
                            );
                        } catch (e) {
                            await page.click(
                                "#nav-global-location-slot #glow-ingress-line2"
                            );
                        }

                        try {
                            await page.waitForSelector(
                                ".a-declarative > .a-dropdown-container > #GLUXCountryListDropdown > .a-button-inner > .a-button-text"
                            );
                            await page.click(
                                ".a-declarative > .a-dropdown-container > #GLUXCountryListDropdown > .a-button-inner > .a-button-text"
                            );
                        } catch (e) {
                            await page.click(
                                ".a-declarative > .a-dropdown-container > #GLUXCountryListDropdown > .a-button-inner > .a-button-text"
                            );
                        }
                        try {
                            await page.waitForSelector(
                                `.a-popover-wrapper #${deliveryCode}`
                            );
                            await page.click(
                                `.a-popover-wrapper #${deliveryCode}`
                            );
                        } catch (e) {
                            await page.click(
                                `.a-popover-wrapper #${deliveryCode}`
                            );
                        }
                    } catch (e) {
                        // Cannot change location do nothing
                    }
                }
            }
            const pageHTML = await page.evaluate(() => {
                return document.body.outerHTML;
            });
            const $ = cheerio.load(pageHTML);
            await runCrawler({
                $,
                session,
                request,
                requestQueue,
                input,
                getReviews,
                env,
            });
        },
        handleFailedRequestFunction: async ({ page, request }) => {
            log.info(`Request ${request.url} failed 4 times`);
            const html = await page.evaluate(() => document.body.outerHTML);
            const $ = cheerio.load(html);
            await Apify.setValue(
                `bug_${Math.random()}.html`,
                $("body").html(),
                { contentType: "text/html" }
            );
        },
    });

    log.info("Crawl start.");
    await crawler.run();
    log.info("Crawl complete.");
});
