/* globals , beforeAll, afterAll, test, expect */
const puppeteer = require('puppeteer');
const verifyCacheHeaders = require('./verify-cache-headers');
const URLTest = require('./url-test');

const config = require(process.env.SMOKE_CONFIG);
const host = process.env.SMOKE_HOST;

let browser;

describe(`Smoke Tests for ${host}`, () => {

	beforeAll(async () => {
		browser = await puppeteer.launch();
	});

	afterAll(async () => {
		await browser.close();
	});


	config.forEach((options) => {
		Object.keys(options.urls).forEach(url => {

			let urlOpts = options.urls[url];
			if(typeof urlOpts !== 'object') {
				urlOpts = { status: urlOpts };
			}

			urlOpts.headers = Object.assign(urlOpts.headers || {}, options.headers || {}, {});
			urlOpts.method = urlOpts.method || options.method;
			urlOpts.body = urlOpts.body || options.body;

			const fullUrl = `${host}${url}`;
			let test = new URLTest(fullUrl, urlOpts);

			describe(url, () => {

				beforeAll(async () => {
					await test.init(browser);
				});

				afterAll(async () => {
					await test.page.close();
				})

				if (test.check.status) {
					it(`should return ${test.check.status}`, () => {
						if(test.check.status === 204) {
							// eslint-disable-next-line no-console
							console.info('204 status checks are not supported yet!');
							// expect(true).toEqual(true);
						} else if(typeof test.check.status === 'string') {
							expect(test.redirect.to).toEqual(test.check.status);
						} else {
							expect(test.status).toEqual(test.check.status);
						}
					});
				}

				if(typeof test.check.pageErrors !== 'undefined') {
					it(`should have no more than ${test.check.pageErrors} console errors`, () => {
						// eslint-disable-next-line no-console
						console.info('Errors in Console: ', test.pageErrors);
						expect(test.pageErrors.length).toEqual(0);
					});
				}

				if (test.check.content) {
					it('should validate content', async () => {
						const content = await test.page.content();
						expect(test.check.content(content)).toBeTruthy();
					});
				}

				if (test.check.cacheHeaders) {
					it('should specify sensible cache headers', () => {
						expect(verifyCacheHeaders.bind(null, test.headers, test.url)).not.toThrow();
					});
				}


				if (test.check.cssCoverage) {

					test.check.cssCoverage.forEach(css => {
						it(`should be using at least ${css.threshold}% of the CSS in ${css.url}`, async () => {
							const percentage = test.coverageFor(css.url);
							if(percentage) {
								// eslint-disable-next-line no-console
								console.info(`CSS coverage for ${css.url}: ${percentage}%`);
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
