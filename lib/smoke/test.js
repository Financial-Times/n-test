const puppeteer = require('puppeteer');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync(process.env.SMOKE_CONFIG, 'utf8'));

const { expect } = require('chai');

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
}

const teardownEach = () => {
	firstStatusCode = null;
}

describe('Smoke Tests', () => {
	before(setup);
	after(teardown);
	afterEach(teardownEach);


	config.tests.forEach((test) => {

		context(test.url, () => {
			let response;
			let coverageReports;

			before(async () => {
				if (test.expect.cssCoverage) {
					page.coverage.startCSSCoverage();
				}
				response = await page.goto(`${host}${test.url}`, { waitUntil: 'domcontentloaded' });
			});

			after(async () => {
				firstStatusCode = null;

			});


			if (test.expect.status) {
				it(`${test.url} should return a ${test.expect.status}`, async () => {
					const status = await response.status();
					expect(status).to.equal(test.expect.status);
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
						const cssFile = coverageReports.find(report => new RegExp(test.url).test(report.url));

						if (cssFile) {
							const totalUsed = cssFile.ranges.reduce((current, range) => {
								return current + (range.end - range.start);
							}, 0);

							const percentage = Number(((totalUsed / cssFile.text.length) * 100).toFixed(1));
							expect(percentage).to.be.greaterThan(test.threshold);
						} else {
							console.warn('No coverage report found that matches regex: ' + test.url);
						}
					});
				});
			}
		});




	});

});
