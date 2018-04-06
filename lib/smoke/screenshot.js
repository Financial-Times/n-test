/* eslint-disable no-console */

const path = require('path');
const fs = require('fs');
const directly = require('directly');
const puppeteer = require('puppeteer');
const filterConfigs = require('./filter-configs');
const setupPage = require('./setup-page');
const PuppeteerPage = require('./puppeteer-page');
const WebdriverPage = require('./webdriver-page');
const getSeleniumGrid = require('./get-selenium-grid');

const takeScreenshot = (pageOpts, browser, headlessBrowser, viewingBrowser) => async () => {
	const pageInstance = browser === 'chrome' ? new PuppeteerPage(pageOpts) : new WebdriverPage(pageOpts, browser);
	console.info(`Taking screenshot on ${browser}...`);
	await pageInstance.init(headlessBrowser);
	const screenshot = await pageInstance.screenshot();
	if(screenshot && screenshot.length) {
		const viewingPage = await viewingBrowser.newPage();
		await viewingPage.evaluate((browser) => {
			document.title = browser;
			const h1 = document.createElement('h1');
			h1.textContent = browser;
			document.body.appendChild(h1);

		}, browser);

		console.info(`Got screenshot from ${browser}!`);
		const dataURI = `data:image/png;base64,${screenshot.toString('base64')}`;

		await viewingPage.evaluate((dataURI) => {
			const img = document.createElement('img');
			img.src = dataURI;
			document.body.appendChild(img);
		}, dataURI);
	}
};

module.exports = async (globalOpts, sets) => {
	const configFile = path.join(process.cwd(), globalOpts.config || 'test/smoke.js');


	if (!fs.existsSync(configFile)) {
		throw new Error(`Config file for smoke test does not exist at ${configFile}. Either create a config file at ./test/smoke.js, or pass in a path using --config.`);
	} else {



		const headlessBrowser = await puppeteer.launch();
		const viewingBrowser = await puppeteer.launch({ headless: false});


		const configsToOpen = await filterConfigs(configFile, sets, true);

		configsToOpen.forEach((suiteOpts) => {
			Object.keys(suiteOpts.urls).forEach(async (path) => {
				let urlOpts = suiteOpts.urls[path];
				const pageOpts = setupPage(path, urlOpts, Object.assign({ browsers: true }, suiteOpts), globalOpts);
				const canRunCrossBrowser = getSeleniumGrid(this.enabledBrowsers);

				if(pageOpts.browsersToRun.length > 1 && !canRunCrossBrowser) {
					console.warn('Please set environment variables for Browserstack or Saucelabs to run cross browser tests.');
				}

				if(suiteOpts.user && !pageOpts.user) {
					return;
				}

				const pagesToScreenshot = [];
				pageOpts.browsersToRun.forEach(browser => {
					pagesToScreenshot.push(takeScreenshot(pageOpts, browser, headlessBrowser, viewingBrowser));
				});

				await directly(3, pagesToScreenshot);

			});
		});

		const cleanup = async () => {
			viewingBrowser && viewingBrowser.close();
			headlessBrowser && headlessBrowser.close();
			await getSeleniumGrid.cleanup();
			process.exit(2);
		};

		process.on('exit', cleanup);
		process.on('SIGINT', cleanup);
	}
};
