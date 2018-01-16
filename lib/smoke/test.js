/* globals , beforeAll, afterAll, test, expect */
const puppeteer = require('puppeteer');

const verifyCacheHeaders = require('./verify-cache-headers');

const config = require(process.env.SMOKE_CONFIG);

const host = process.env.SMOKE_HOST || 'http://localhost:3002';

let browser;
let page;

const setup = async () => {
	browser = await puppeteer.launch();
	page = await browser.newPage();
};

const teardown = async () => {
	await browser.close();
};

const REDIRECT_CODES = [301, 302, 303, 307, 308];


describe('Smoke Tests', () => {
	beforeAll(setup);
	afterAll(teardown);


	config.forEach((conf) => {
		Object.keys(conf.urls).forEach(url => {
			let test = conf.urls[url];
			if(typeof test !== 'object') {
				test = { status: test };
			}

			describe(url, () => {
				let response;
				let headers;
				let coverageReports;
				let redirects = {};

				const fullUrl = `${host}${url}`;

				beforeAll(async () => {
					if(test.cssCoverage) {
						page.coverage.startCSSCoverage();
					}

					if(process.env.SMOKE_AUTHENTICATE === true && process.env.FT_NEXT_BACKEND_KEY) {
						await page.setExtraHTTPHeaders({
							'FT-Next-Backend-Key': process.env.FT_NEXT_BACKEND_KEY
						});
					}

					if(conf.headers) {
						await page.setExtraHTTPHeaders(conf.headers);
					}

					if(test.headers) {
						await page.setExtraHTTPHeaders(test.headers);
					}

					page.on('response', response => {
						const request = response.request();
						const status = response.status();
						// if this response is a redirect
						if (REDIRECT_CODES.includes(status)) {
							redirects[request.url()] = {
								status: status,
								to: response.url()
							};
						}
					});

					response = await page.goto(fullUrl);
					headers = response.headers();
				});

				if (test.status) {
					it(`should return a ${test.status}`, () => {

						if(REDIRECT_CODES.includes(test.status)) {
							const redirect = redirects[fullUrl];
							expect(redirect.status).toEqual(test.status);
						} else if (typeof test.status === 'string') {
							const eventualUrl = response.url()
							expect(eventualUrl).toEqual(`${host}${test.status}`);
						} else {
							const status = response.status();
							expect(status).toEqual(test.status);

						}
					});
				}

				if (test.content) {
					it('should validate content', async () => {
						const content = await page.content();
						expect(test.content(content)).toBeTruthy();
					});
				}

				if (test.cacheHeaders) {
					it('should specify sensible cache headers', () => {
						expect(verifyCacheHeaders.bind(null, headers, url)).not.toThrow();
					});
				}


				if (test.cssCoverage) {

					test.cssCoverage.forEach(css => {

						it(`should be using at least ${css.threshold}% of ${css.url}`, async () => {

							coverageReports = coverageReports || await page.coverage.stopCSSCoverage();
							const cssFile = coverageReports.find(report => report.url.includes(css.url));

							if (cssFile) {
								const totalUsed = cssFile.ranges.reduce((current, range) => {
									return current + (range.end - range.start);
								}, 0);

								const percentage = Number(((totalUsed / cssFile.text.length) * 100).toFixed(1));
								// eslint-disable-next-line no-console
								console.info(`CSS coverage for ${cssFile.url}: ${percentage}%`);
								expect(percentage).toBeGreaterThan(css.threshold);
							} else {
								throw new Error('No coverage report found for URL that includes: ' + css.url);
							}
						});
					});
				}

			});
		});
	});
});
