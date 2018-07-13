const SmokeTests = require('../lib/smoke/smoke-test');

module.exports = (program) => {

	const collectHeaders = (val, memo) => {
		memo.push(val);
		return memo;
	};

	program
		.command('smoke [sets...]')
		.option('-a, --auth', 'Authenticate with FT_NEXT_BACKEND_KEY')
		.option('-b, --browsers [value]', 'Selenium browsers to run the test against')
		.option('-H, --host [value]', 'Set the hostname to use for all tests')
		.option('-c, --config [value]', 'Path to config file used to test. Defaults to ./test/smoke.js')
		.option('-i, --interactive [value]', 'Interactively choose which tests to run. Defaults to false')
		.option('--header [value]', 'Request headers to be sent with every request. e.g. "X-Api-Key: 1234"', collectHeaders, [])
		.description('Tests that a given set of urls for an app respond as expected. Expects the config file ./test/smoke.js to exist')
		.action((sets, opts) => {
			const globalHeaders = {};
			opts.header.forEach(header => {
				const split = header.split(':');
				if(split.length > 1) {
					globalHeaders[split[0].trim()] = split[1].trim();
				}
			});

			delete opts.header;
			opts.headers = globalHeaders;

			if(opts.browsers) {
				opts.browsers = opts.browsers.split(',');
			}

			const smokeTests = new SmokeTests(opts);
			smokeTests.run(sets).catch(err => {
				if(err.failed && err.failed.length) {
					// eslint-disable-next-line no-console
					console.error(`${err.failed.length} URLs failed their check.`);
				} else if(err.errors && err.errors.length) {
					// eslint-disable-next-line no-console
					console.error(`An unacceptable number (${err.errors.length}) tests threw errors`);
				} else {
					// eslint-disable-next-line no-console
					console.error(err);
				}
				process.exit(1);
			});
		});
};
