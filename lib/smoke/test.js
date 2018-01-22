const puppeteer = require('puppeteer');
const URLTest = require('./url-test');
const verifyUrl = require('./verify-url')

const directly = require('directly');

const run = async (configFile, host, authenticate) => {
	const config = require(configFile);
	const browser = await puppeteer.launch();

	const urlTests = [];

	const failedUrls = [];

	config.forEach((suiteOpts) => {
		Object.entries(suiteOpts.urls).forEach(async ([url, urlOpts]) => {

			if (typeof urlOpts !== 'object') {
				urlOpts = { status: urlOpts };
			}

			urlOpts.headers = Object.assign(urlOpts.headers || {}, suiteOpts.headers || {}, {});
			urlOpts.method = urlOpts.method || suiteOpts.method;
			urlOpts.body = urlOpts.body || suiteOpts.body;

			const fullUrl = `${host}${url}`;
			const testPage = new URLTest(fullUrl, urlOpts);

			urlTests.push(
				verifyUrl(testPage, browser)
			);
		});
	});

	return directly(5, urlTests)
		.then((results) => {

			browser.close();
			const totalResults = {
				urlsTested: results.length,
				passed: results.filter(url => url.failed === 0),
				failed: results.filter(url => url.failed > 0)
			};
			if(totalResults.failed.length) {
				console.error(`${totalResults.failed.length} URLs failed their check.`);
				return Promise.reject(totalResults);
			} else {
				return Promise.resolve(totalResults);
			}
		});

};

module.exports = run;
