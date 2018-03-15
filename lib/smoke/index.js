/* eslint-disable no-console */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const directly = require('directly');
const chalk = require('chalk');

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
		//TODO: default should be chrome, browsers will be opt-in
		this.enabledBrowsers = opts.browsers || ['chrome', 'firefox', 'safari', 'internet explorer', 'MicrosoftEdge', 'android'];
		this.canRunCrossBrowser = (process.env.SAUCE_USER && process.env.SAUCE_KEY);

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

			urlOpts.requestHeaders = Object.assign({}, this.globalHeaders, urlOpts.headers || {}, suiteOpts.headers || {});
			urlOpts.method = urlOpts.method || suiteOpts.method;
			urlOpts.body = urlOpts.body || suiteOpts.body;
			urlOpts.https = urlOpts.https || suiteOpts.https;
			urlOpts.user = suiteOpts.user;

			let host = this.host;

			if(urlOpts.user) {

				if(host.includes('local')) {
					console.warn('Cannot run user based tests on local URLs, as they rely on the FT-Test-Host. To run this locally, please use ngrok');
					return;
				}
				host = 'https://www.ft.com';
				urlOpts.requestHeaders = Object.assign({
					'FT-Test-Host': this.host.replace('https://', '').replace('http://', '')
				}, urlOpts.requestHeaders);
			}
;

			const fullUrl = `${host}${url}`;
			const browsers = urlOpts.browsers || suiteOpts.browsers;
			let browsersToRun = ['chrome'];
			if(Array.isArray(browsers)) {
				browsersToRun = browsers.filter(browser => this.enabledBrowsers.includes(browser));
			} else if (browsers === true) {
				browsersToRun = this.enabledBrowsers;
			}

			if(browsersToRun.length > 1 && !this.canRunCrossBrowser) {
				console.warn('Please set SAUCE_USER and SAUCE_KEY environment variables to be able to run cross browser tests');
			}

			browsersToRun.forEach(browser => {
				if(browser === 'chrome') {
					const puppeteerPage = new PuppeteerPage(fullUrl, urlOpts);
					puppetTests.push(verifyUrl(puppeteerPage, this.browser, this.checks));
				} else if (urlOpts.elements && this.canRunCrossBrowser) {
					const webdriverPage = new WebdriverPage(fullUrl, urlOpts, browser);
					crossBrowserTests.push(verifyUrl(webdriverPage, null, this.checks));
				}
			});
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

		console.log('--------------------------------');
		console.log(chalk`{bold.underline Smoke Test Results}`);
		console.log(chalk`{bgBlue URLs tested:} ${totalResults.urlsTested}`);
		console.log(chalk`{bgGreen Passed:} ${totalResults.passed.length}`);
		console.log(chalk`{bgRed Failed:} ${totalResults.failed.length}`);
		console.log('--------------------------------');


		if(totalResults.failed.length) {
			return Promise.reject(totalResults);
		} else {
			return Promise.resolve(totalResults);
		}
	}

};

module.exports = SmokeTest;
