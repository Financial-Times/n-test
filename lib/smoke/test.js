/* globals , beforeAll, afterAll, test, expect */
const puppeteer = require('puppeteer');

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
				let coverageReports;

				beforeAll(async () => {
					if(test.cssCoverage) {
						page.coverage.startCSSCoverage();
					}

					if(process.env.SMOKE_AUTHENTICATE) {
						await page.setExtraHTTPHeaders({
							'FT-Next-Backend-Key': process.env.FT_NEXT_BACKEND_KEY
						});
					}

					if(config.headers) {
						await page.setExtraHTTPHeaders(config.headers);
					}

					if(test.headers) {
						await page.setExtraHTTPHeaders(test.headers);
					}

					response = await page.goto(`${host}${url}`);

				});

				if (test.status) {
					it(`should return a ${test.status}`, async () => {
						const status = await response.status();
						expect(status).toEqual(test.status);
					});
				}

				if (test.content) {
					it('should validate content', async () => {
						const content = await page.content();
						expect(test.content(content)).toBeTruthy();
					});
				}


				if (test.cssCoverage) {

					test.cssCoverage.forEach(css => {

						it(`should be using at least ${css.threshold}% of ${test.url}`, async () => {

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
