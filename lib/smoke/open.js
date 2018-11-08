const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const PuppeteerPage = require('./puppeteer-page');
const filterConfigs = require('./filter-configs');
const setupPage = require('./setup-page');


module.exports = async (globalOpts, sets) => {
	const configFile = path.join(process.cwd(), globalOpts.config || 'test/smoke.js');
	let browser;

	if (!fs.existsSync(configFile)) {
		throw new Error(`Config file for smoke test does not exist at ${configFile}. Either create a config file at ./test/smoke.js, or pass in a path using --config.`);
	} else {
		console.log('Launching browser...'); //eslint-disable-line no-console
		browser = await puppeteer.launch({ headless: false });
		const configsToOpen = await filterConfigs(configFile, sets, true);
		configsToOpen.forEach((suiteOpts) => {
			Object.keys(suiteOpts.urls).forEach(async (path) => {
				let urlOpts = suiteOpts.urls[path];
				const pageOpts = setupPage(path, urlOpts, suiteOpts, globalOpts);
				const puppeteerPage = new PuppeteerPage(pageOpts);
				console.log(`Opening: ${puppeteerPage.host}${path}`); //eslint-disable-line no-console
				await puppeteerPage.init(browser);
			});
		});
	}

	const cleanup = async (code) => {
		browser && browser.close();
		await require('./get-selenium-grid').cleanup();
		process.exit(code);
	};

	process.on('exit', cleanup);
	process.on('SIGINT',cleanup);
};
