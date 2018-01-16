const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

module.exports = async (opts) => {
	const configFile = path.join(process.cwd(), opts.config || 'test/smoke.js');
	if (!fs.existsSync(configFile)) {
		throw new Error(`Config file for smoke test does not exist at ${configFile}. Either create a config file at ./test/smoke.js, or pass in a path using --config.`);
	} else {
		const config = require(configFile);
		const host = opts.host || 'http://localhost:3002';
		const browser = await puppeteer.launch({headless: false});

		config.forEach((conf) => {
			Object.keys(conf.urls).forEach(async url => {
				let test = conf.urls[url];
				const page = await browser.newPage();

				if(opts.authenticate) {
					page.setExtraHTTPHeaders({
						'FT-Next-Backend-Key': process.env.FT_NEXT_BACKEND_KEY
					});
				}

				if(config.headers) {
					page.setExtraHTTPHeaders(config.headers);
				}

				if(test.headers) {
					page.setExtraHTTPHeaders(test.headers);
				}

				page.goto(`${host}${url}`);
			});
		});
	}
};
