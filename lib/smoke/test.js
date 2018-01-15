/* globals , beforeAll, afterAll, test, expect */
const puppeteer = require('puppeteer');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync(process.env.SMOKE_CONFIG, ''));

const host = process.env.SMOKE_HOST || 'http://localhost:3002';

let browser;
let page;
let firstStatusCode;

const onResponseHandler = async (response) => {
	const status = await response.status();
	if (!firstStatusCode) {
		firstStatusCode = status;
	}
};

const setup = async () => {
	firstStatusCode = null;
	browser = await puppeteer.launch();
	page = await browser.newPage();
	page.on('response', onResponseHandler);
};

const teardown = async () => {
	firstStatusCode = null;
	await browser.close();
};

const teardownEach = () => {
	firstStatusCode = null;
};

describe('Smoke Tests', () => {
	beforeAll(setup);
	afterAll(teardown);
	afterEach(teardownEach);


	config.tests.forEach((test) => {

		describe(test.url, () => {
			let response;
			let coverageReports;

			beforeAll(async () => {
				if (test.expect.cssCoverage) {
					page.coverage.startCSSCoverage();
				}
				response = await page.goto(`${host}${test.url}`);
			});

			afterAll(async () => {
				firstStatusCode = null;
			});


			if (test.expect.status) {
				it(`${test.url} should return a ${test.expect.status}`, async () => {
					const status = await response.status();
					expect(status).toEqual(test.expect.status);
					//TODO: Response.status follows redirect. Check the first status code to check for 301
					//BUT firstStatusCode as implemented above sometimes picks up spoor requests,
					//so need to check url or something
					// expect(firstStatusCode).to.equal(test.expect.status);
				});
			}

			if (test.expect.cssCoverage) {

				test.expect.cssCoverage.forEach(test => {

					it(`should be using at least ${test.threshold}% of ${test.url}`, async () => {

						coverageReports = coverageReports || await page.coverage.stopCSSCoverage();
						const cssFile = coverageReports.find(report => report.url.includes(test.url));

						if (cssFile) {
							const totalUsed = cssFile.ranges.reduce((current, range) => {
								return current + (range.end - range.start);
							}, 0);

							const percentage = Number(((totalUsed / cssFile.text.length) * 100).toFixed(1));
							// eslint-disable-next-line no-console
							console.info(`CSS coverage for ${cssFile.url}: ${percentage}%`);
							expect(percentage).toBeGreaterThan(test.threshold);
						} else {
							throw new Error('No coverage report found for URL that includes: ' + test.url);
						}
					});
				});
			}
		});




	});

});
