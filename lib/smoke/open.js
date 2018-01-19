const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const URLTest = require('./url-test');

module.exports = async (sets, opts) => {
	const configFile = path.join(process.cwd(), opts.config || 'test/smoke.js');
	if (!fs.existsSync(configFile)) {
		throw new Error(`Config file for smoke test does not exist at ${configFile}. Either create a config file at ./test/smoke.js, or pass in a path using --config.`);
	} else {
		const config = require(configFile);
		const host = opts.host || 'http://localhost:3002';
		const browser = await puppeteer.launch({headless: false});

		let configsToOpen;
		if(sets && sets.length) {
			configsToOpen = config.filter(test => test.name && sets.includes(test.name) );
		} else {
			configsToOpen = config;
		}

		// eslint-disable-next-line no-console
		console.info('Opening URLs from test sets: ', sets);

		configsToOpen.forEach((options) => {
			Object.keys(options.urls).forEach(async (url) => {
				let urlOpts = options.urls[url];
				if (typeof urlOpts !== 'object') {
					urlOpts = { status: urlOpts };
				}

				urlOpts.headers = Object.assign(urlOpts.headers || {}, options.headers || {}, {});
				urlOpts.method = urlOpts.method || options.method;
				urlOpts.body = urlOpts.body || options.body;

				urlOpts.breakpoint = options.breakpoint || opts.breakpoint;

				const fullUrl = `${host}${url}`;
				const test = new URLTest(fullUrl, urlOpts);
				await test.init(browser);
			});
		});
	}
};
