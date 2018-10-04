/* eslint-disable no-console */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const directly = require('directly');
const chalk = require('chalk');

const checks = require('../checks');
const filterConfigs = require('./filter-configs');
const setupPage = require('./setup-page');
const verifyUrl =require('./verify-url');
const PuppeteerPage = require('./puppeteer-page');
const WebdriverPage = require('./webdriver-page');
const getBrowserstackConfig = require('./get-browserstack-config');

const ERROR_THRESHOLD=2;

class SmokeTest {

	constructor (options) {
		this.globalHeaders = options.headers || {};
		this.checks = Object.assign(options.checks || {}, checks, {});
		this.configFile = path.join(process.cwd(), options.config || 'test/smoke.js');
		this.isInteractive = options.interactive;
		this.host = options.host || 'https://local.ft.com:5050';
		this.breakpoint = options.breakpoint;
		this.browsers = options.browsers;
		//TODO: default should be chrome, browsers will be opt-in

		if (!/https?\:\/\//.test(this.host)) {
			this.host = 'http://' + this.host;
		}

		if (!fs.existsSync(this.configFile)) {
			throw new Error(`Config file for smoke test does not exist at ${this.configFile}. Either create a config file at ./test/smoke.js, or pass in a path using --config.`);
		}

		//On manual Ctrl-C quitting, cleanup leftover browserstack etc.
		process.on('SIGINT', async (code) => {
			await this.cleanup();
			process.exit(code);
		});
	}

	addCheck (name, customCheckFunction) {
		this.checks[name] = customCheckFunction;
	};

	async cleanup () {
		this.browser && this.browser.close();
		return await getBrowserstackConfig.cleanup();
	}

	async compileTests (sets) {
		const configsToRun = await filterConfigs(this.configFile, sets, this.isInteractive);
		const canRunCrossBrowser = await getBrowserstackConfig(this.enabledBrowsers);
		const globalOptions = {
			headers: this.globalHeaders,
			browsers: this.browsers,
			breakpoint: this.breakpoint,
			host: this.host
		};

		const puppetTests = [];
		const crossBrowserTests = [];

		// https://github.com/GoogleChrome/puppeteer/issues/2377
		const launchOptions = (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'development') ?
			{args: ['--ignore-certificate-errors', '--enable-features=NetworkService', '--no-sandbox', '--disable-setuid-sandbox']} :
			{};
		this.browser = await puppeteer.launch(launchOptions);

		for (let suiteOptions of configsToRun) {
			for (let path in suiteOptions.urls) { //eslint-disable-line guard-for-in
				if (!suiteOptions.urls.hasOwnProperty(path)) {
					return;
				}

				let urlOptions = suiteOptions.urls[path];

				const pageOptions = setupPage(path, urlOptions, suiteOptions, globalOptions);

				if (pageOptions.browsersToRun.length > 1 && !canRunCrossBrowser) {
					console.warn('Please set BROWSERSTACK_KEY and BROWSERSTACK_USER environment variables to run cross browser tests.');
				}

				if (suiteOptions.user && !pageOptions.user) {
					continue;
				}

				pageOptions.browsersToRun.forEach(browser => {
					if (browser === 'chrome') {
						const puppeteerPage = new PuppeteerPage(pageOptions);
						puppetTests.push(verifyUrl(puppeteerPage, this.browser, this.checks));
					} else if (pageOptions.elements && canRunCrossBrowser) {
						const webdriverPage = new WebdriverPage(pageOptions, browser, true);
						crossBrowserTests.push(verifyUrl(webdriverPage, null, this.checks));
					}
				});
			}
		}
		return [puppetTests, crossBrowserTests];
	}

	async run (sets) {
		const startTime = new Date().getTime();
		const [puppetTests, crossBrowserTests] = await this.compileTests(sets);

		try {
			const allTests = [directly(15, puppetTests)];
			if (crossBrowserTests.length > 0) {
				allTests.push(directly(5, crossBrowserTests));
			} else {
				allTests.push(Promise.resolve([]));
			}

			const [puppetResults, crossBrowserResults] = await Promise.all(allTests);
			const timeTaken = new Date(new Date().getTime() - startTime).toISOString().substr(14, 5);

			return await this.displayResults(puppetResults, crossBrowserResults, timeTaken);
		} finally {
			await this.cleanup();
		}
	}

	async displayResults (puppetResults, crossBrowserResults, timeTaken) {
		let results = [];
		results = results.concat(puppetResults).concat(crossBrowserResults);

		const totalResults = {
			urlsTested: results.length,
			passed: results.filter(url => (url.failed === 0 && url.errors === 0)),
			failed: results.filter(url => url.failed > 0),
			errors: results.filter(url => url.errors > 0)
		};

		console.log('--------------------------------');
		console.log(chalk `{bold.underline Smoke Test Results}`);
		console.log(chalk `{bgBlue URLs tested:} ${totalResults.urlsTested}`);
		console.log(chalk `{bgGreen Passed:} ${totalResults.passed.length}`);
		console.log(chalk `{bgRed Failed:} ${totalResults.failed.length}`);
		console.log(chalk `{bgBlack Errors:} ${totalResults.errors.length}`);
		console.log(chalk `{bgWhite Time Taken:} ${timeTaken}s`);
		console.log('--------------------------------');

		if (totalResults.failed.length || totalResults.errors.length > ERROR_THRESHOLD) {
			return Promise.reject(totalResults);
		} else {
			return Promise.resolve(totalResults);
		}
	}
};

module.exports = SmokeTest;
