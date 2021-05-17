const Apify = require("apify");
const cheerio = require("cheerio");

const { log } = Apify.utils;
const runCrawler = require('./runCrawler');

const { sleep } = Apify.utils;

Apify.main(async () => {
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
        log.info(categoryUrl.url);
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
                // args: ['--disable-extensions']
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
            log.info("handlePageFunction starting")
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
            const pageHTML = await page.evaluate(() => {
                return document.body.outerHTML;
            });
            const $ = cheerio.load(pageHTML);
            try{
                await runCrawler({
                    $,
                    session,
                    request,
                    requestQueue,
                    input,
                    getReviews,
                    env,
                });
            }catch(err){
                log.error("CRAW ERROR ", err);
            }
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
