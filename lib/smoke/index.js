const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const directly = require('directly');

const checks = require('./checks');
const filterConfigs = require('./filter-configs');
const verifyUrl = require('./verify-url');
const PuppeteerPage = require('./puppeteer-page');
const WebdriverPage = require('./webdriver-page');


class SmokeTest {

	constructor (opts) {
		this.globalHeaders = opts.headers || {};
		this.checks = Object.assign(opts.checks || {}, checks, {});
		this.configFile = path.join(process.cwd(), opts.config || 'test/smoke.js');
		this.isInteractive = opts.interactive;
		this.host = opts.host || 'http://localhost:3002';
		this.browsers = opts.browsers;

		if (!/https?\:\/\//.test(this.host)) {
			this.host = 'http://' + this.host;
		}

		if (!fs.existsSync(this.configFile)) {
			throw new Error(`Config file for smoke test does not exist at ${this.configFile}. Either create a config file at ./test/smoke.js, or pass in a path using --config.`);
		}
	}

	addCheck (name, fn) {
		this.checks[name] = fn;
	};

	async runSuite (suiteOpts) {
		const puppetTests = [];
		const crossBrowserTests = [];

		Object.entries(suiteOpts.urls).forEach(async ([url, urlOpts]) => {

			if (typeof urlOpts !== 'object') {
				urlOpts = { status: urlOpts };
			}

			urlOpts.requestHeaders = Object.assign(this.globalHeaders, urlOpts.headers || {}, suiteOpts.headers || {}, {});
			urlOpts.method = urlOpts.method || suiteOpts.method;
			urlOpts.body = urlOpts.body || suiteOpts.body;
			urlOpts.https = urlOpts.https || suiteOpts.https;

			const fullUrl = `${this.host}${url}`;
			const puppeteerPage = new PuppeteerPage(fullUrl, urlOpts);

			puppetTests.push(verifyUrl(puppeteerPage, this.browser, this.checks));

			const browsers = urlOpts.browsers || suiteOpts.browsers || this.browsers;

			if(urlOpts.elements && browsers) {
				let browsersToRun = Array.isArray(browsers) ? browsers : ['firefox', 'safari', 'internet explorer', 'MicrosoftEdge'];
				browsersToRun.forEach(browser => {
					const webdriverPage = new WebdriverPage(fullUrl, urlOpts, browser);
					crossBrowserTests.push(verifyUrl(webdriverPage, null, this.checks));
				});
			}
		});

		const allTests = [directly(5, puppetTests)];
		if(crossBrowserTests.length) {
			allTests.push(directly(5, crossBrowserTests));
		} else {
			allTests.push(Promise.resolve([]));
		}

		return Promise.all(allTests);
	}


	async run (sets) {
		const configsToRun = await filterConfigs(this.configFile, sets, this.isInteractive);
		this.browser = await puppeteer.launch();

		let results = [];

		try {
			for(let suiteOpts of configsToRun) {
				const [puppetResults, crossBrowserResults] = await this.runSuite(suiteOpts);
				results = results.concat(puppetResults).concat(crossBrowserResults);
			}
		} finally {
			this.browser.close();
		}

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
	}

};

module.exports = SmokeTest;
