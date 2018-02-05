const puppeteer = require('puppeteer');
const TestPage = require('./test-page');
const verifyUrl = require('./verify-url');

const directly = require('directly');

const runSuite = async (suiteOpts, host, authenticate, browser) => {
	const urlTests = [];

		Object.entries(suiteOpts.urls).forEach(async ([url, urlOpts]) => {

			if (typeof urlOpts !== 'object') {
				urlOpts = { status: urlOpts };
			}

			urlOpts.headers = Object.assign(urlOpts.headers || {}, suiteOpts.headers || {}, {});

			if(authenticate && process.env.FT_NEXT_BACKEND_KEY) {
				urlOpts.headers['FT-Next-Backend-Key'] = process.env.FT_NEXT_BACKEND_KEY;
			}

			urlOpts.method = urlOpts.method || suiteOpts.method;
			urlOpts.body = urlOpts.body || suiteOpts.body;
			urlOpts.https = urlOpts.https || suiteOpts.https;

			const fullUrl = `${host}${url}`;
			const testPage = new TestPage(fullUrl, urlOpts);

			urlTests.push(
				verifyUrl(testPage, browser)
			);
		});

		return directly(5, urlTests);
};

const run = async (config, host, authenticate) => {
	const browser = await puppeteer.launch();

	let results = [];

	for(let suiteOpts of config) {
		const suiteResults = await runSuite(suiteOpts, host, authenticate, browser);
		results = results.concat(suiteResults);
	}

	browser.close();

	const totalResults = {
		urlsTested: results.length,
		passed: results.filter(url => url.failed === 0),
		failed: results.filter(url => url.failed > 0)
	};
	if(totalResults.failed.length) {
		return Promise.reject(totalResults);
	} else {
		return Promise.resolve(totalResults);
	}

};

module.exports = run;
