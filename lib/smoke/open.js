const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const TestPage = require('./test-page');
const inquirer = require('inquirer');

const askForSets = async (config) => {
	const possibilities = config.map((test, index)=> test.name || 'Untitled ' + index);
	const responses = await inquirer.prompt({
		name: 'choices',
		type: 'checkbox',
		message: 'Select the URL sets to open',
		choices: possibilities
	});
	return [].concat(responses.choices);
};


module.exports = async (sets, opts) => {
	const configFile = path.join(process.cwd(), opts.config || 'test/smoke.js');
	if (!fs.existsSync(configFile)) {
		throw new Error(`Config file for smoke test does not exist at ${configFile}. Either create a config file at ./test/smoke.js, or pass in a path using --config.`);
	} else {
		const config = require(configFile);
		let configsToOpen;
		if(!(sets && sets.length)) {
			sets = await askForSets(config);
		}


		const host = opts.host || 'http://localhost:3002';
		const browser = await puppeteer.launch({headless: false});

		if(sets && sets.length) {
			configsToOpen = config.filter((test, index) => (sets.includes(test.name) || sets.includes('Untitled ' + index)));
		} else {
			configsToOpen = config;
		}

		// eslint-disable-next-line no-console
		console.info('Opening URLs from test sets: ', sets);

		configsToOpen.forEach((suiteOpts) => {
			Object.keys(suiteOpts.urls).forEach(async (url) => {
				let urlOpts = suiteOpts.urls[url];
				if (typeof urlOpts !== 'object') {
					urlOpts = { status: urlOpts };
				}

				urlOpts.headers = Object.assign(urlOpts.headers || {}, suiteOpts.headers || {}, {});
				urlOpts.method = urlOpts.method || suiteOpts.method;
				urlOpts.body = urlOpts.body || suiteOpts.body;

				urlOpts.breakpoint = urlOpts.breakpoint || suiteOpts.breakpoint;

				const fullUrl = `${host}${url}`;
				const testPage = new TestPage(fullUrl, urlOpts);
				await testPage.init(browser);
			});
		});
	}
};
