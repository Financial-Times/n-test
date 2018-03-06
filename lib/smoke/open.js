const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const PuppeteerPage = require('./puppeteer-page');
const filterConfigs = require('./filter-configs');

module.exports = async (opts, sets) => {
	const configFile = path.join(process.cwd(), opts.config || 'test/smoke.js');
	if (!fs.existsSync(configFile)) {
		throw new Error(`Config file for smoke test does not exist at ${configFile}. Either create a config file at ./test/smoke.js, or pass in a path using --config.`);
	} else {

		const host = opts.host || 'http://localhost:3002';
		const browser = await puppeteer.launch({ headless: false });
		const configsToOpen = await filterConfigs(configFile, sets, true);

		configsToOpen.forEach((suiteOpts) => {
			Object.keys(suiteOpts.urls).forEach(async (url) => {
				let urlOpts = suiteOpts.urls[url];
				if (typeof urlOpts !== 'object') {
					urlOpts = { status: urlOpts };
				}

				urlOpts.headers = Object.assign(urlOpts.headers || {}, suiteOpts.headers || {}, {});
				urlOpts.method = urlOpts.method || suiteOpts.method;
				urlOpts.body = urlOpts.body || suiteOpts.body;

				urlOpts.breakpoint = urlOpts.breakpoint || suiteOpts.breakpoint || opts.breakpoint;

				const fullUrl = `${host}${url}`;
				const puppeteerPage = new PuppeteerPage(fullUrl, urlOpts);
				await puppeteerPage.init(browser);
			});
		});
	}
};
