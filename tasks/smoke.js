const SmokeTests = require('../lib/smoke');

module.exports = (program) => {

	const collectHeaders = (val, memo) => {
		memo.push(val);
		return memo;
	};

	program
		.command('smoke [sets...]')
		.option('-a, --auth', 'Authenticate with FT_NEXT_BACKEND_KEY')
		.option('-H, --host [value]', 'Set the hostname to use for all tests')
		.option('-c, --config [value]', 'Set the path to the global config file. Defaults to .n-test.js')
		.option('-t, --testFile [value]', 'Path to config file used to test. Defaults to ./test/smoke.json')
		.option('-i, --interactive [value]', 'Interactively choose which tests to run. Defaults to false')
		.option('--header [value]', 'Request headers to be sent with every request. e.g. "X-Api-Key: 1234"', collectHeaders, [])
		.description('Tests that a given set of urls for an app respond as expected. Expects the config file ./test/smoke.json to exist')
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

			const smokeTests = new SmokeTests(opts);
			smokeTests.run(sets).catch(err => {
				if(err.failed) {
					// eslint-disable-next-line no-console
					console.error(`${err.failed.length} URLs failed their check.`);
				} else {
					// eslint-disable-next-line no-console
					console.error(err);
				}
				process.exit(0);
			});
		});
};
