/* eslint-disable no-console */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const directly = require('directly');
const chalk = require('chalk');

const checks = require('./checks');
const filterConfigs = require('./filter-configs');
const setupPage = require('./setup-page');
const verifyUrl =require('./verify-url');
const PuppeteerPage = require('./puppeteer-page');
const WebdriverPage = require('./webdriver-page');
const getSeleniumGrid = require('./get-selenium-grid');

const ERROR_THRESHOLD=2;

class SmokeTest {

	constructor (opts) {
		this.globalHeaders = opts.headers || {};
		this.checks = Object.assign(opts.checks || {}, checks, {});
		this.configFile = path.join(process.cwd(), opts.config || 'test/smoke.js');
		this.isInteractive = opts.interactive;
		this.host = opts.host || 'https://local.ft.com:5050';
		this.breakpoint = opts.breakpoint;
		this.browsers = opts.browsers;
		//TODO: default should be chrome, browsers will be opt-in

		if (!/https?\:\/\//.test(this.host)) {
			this.host = 'http://' + this.host;
		}

		if (!fs.existsSync(this.configFile)) {
			throw new Error(`Config file for smoke test does not exist at ${this.configFile}. Either create a config file at ./test/smoke.js, or pass in a path using --config.`);
		}


		process.on('exit', this.cleanup.bind(this));
		process.on('SIGINT', this.cleanup.bind(this));

	}

	addCheck (name, fn) {
		this.checks[name] = fn;
	};

	async runSuite (suiteOpts) {
		const puppetTests = [];
		const crossBrowserTests = [];

		const globalOpts = {
			headers: this.globalHeaders,
			browsers: this.browsers,
			breakpoint: this.breakpoint,
			host: this.host
		};


		Object.entries(suiteOpts.urls).forEach(async ([path, urlOpts]) => {

			const pageOpts = setupPage(path, urlOpts, suiteOpts, globalOpts);

			const canRunCrossBrowser = getSeleniumGrid(this.enabledBrowsers);

			if(pageOpts.browsersToRun.length > 1 && !canRunCrossBrowser) {
				console.warn('Please set environment variables for Browserstack or Saucelabs to run cross browser tests.');
			}

			if(suiteOpts.user && !pageOpts.user) {
				return;
			}

			pageOpts.browsersToRun.forEach(browser => {
				if(browser === 'chrome') {
					const puppeteerPage = new PuppeteerPage(pageOpts);
					puppetTests.push(verifyUrl(puppeteerPage, this.browser, this.checks));
				} else if (pageOpts.elements && canRunCrossBrowser) {
					const webdriverPage = new WebdriverPage(pageOpts, browser, true);
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

	async cleanup () {
		this.browser && this.browser.close();
		await getSeleniumGrid.cleanup();
		process.exit(2);
	}

	async run (sets) {
		const startTime = new Date().getTime();
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
			passed: results.filter(url => (url.failed === 0 && url.errors === 0)),
			failed: results.filter(url => url.failed > 0),
			errors: results.filter(url => url.errors > 0)
		};

		console.log('--------------------------------');
		console.log(chalk`{bold.underline Smoke Test Results}`);
		console.log(chalk`{bgBlue URLs tested:} ${totalResults.urlsTested}`);
		console.log(chalk`{bgGreen Passed:} ${totalResults.passed.length}`);
		console.log(chalk`{bgRed Failed:} ${totalResults.failed.length}`);
		console.log(chalk`{bgBlack Errors:} ${totalResults.errors.length}`);
		console.log(chalk`{bgWhite Time Taken:} ${new Date(new Date().getTime() - startTime).toISOString().substr(14, 5)}s`);
		console.log('--------------------------------');


		if(totalResults.failed.length || totalResults.errors.length > ERROR_THRESHOLD) {
			return Promise.reject(totalResults);
		} else {
			return Promise.resolve(totalResults);
		}
	}

};

module.exports = SmokeTest;
