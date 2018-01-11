const puppeteer = require('puppeteer');
const fs = require('fs');


const config = JSON.parse(fs.readFileSync(process.env.SMOKE_CONFIG, 'utf8'));


const { expect } = require('chai');

const host = process.env.SMOKE_HOST || 'http://localhost:3002';

let browser;
let page;
let firstStatusCode;


const setup = async () => {
	firstStatusCode = null;
	browser = await puppeteer.launch();
	page = await browser.newPage();

	await page.coverage.startCSSCoverage();

	const onResponseHandler = async (response) => {
		const status = await response.status();
		if(!firstStatusCode) {
			firstStatusCode = status;
		}
	};
	page.on('response', onResponseHandler);
};

const teardown = async () => {
	firstStatusCode = null;
	await browser.close();
}

describe('Smoke Tests', () => {
	before(setup);
	after(teardown);


	config.tests.forEach((test, i) => {
		it(`${test.url} should return a ${test.expect.status}`, async () => {
			const response = await page.goto(`${host}${test.url}` );
			expect(firstStatusCode).to.equal(test.expect.status);
		});
	});

	// context('CSS Coverage', () => {

	// 	it('should be using at least 50% of head.css', async () => {
	// 		const coverageReports = await page.coverage.stopCSSCoverage();
	// 		const headCSS = coverageReports.find(report => !report.url.endsWith('.css'));
	// 		const totalUsed = headCSS.ranges.reduce((current, range) => {
	// 			return current + (range.end - range.start);
	// 		}, 0);

	// 		const percentage = ((totalUsed / headCSS.text.length) * 100).toFixed(1);

	// 		expect(percentage).to.be.greaterThan(50);
	// 	});


	// });




});
