const smokeTests = require('../lib/smoke');

module.exports = (program) => {
	program
		.command('smoke [sets...]')
		.option('-a, --auth', 'Authenticate with FT_NEXT_BACKEND_KEY')
		.option('-H, --host [value]', 'Set the hostname to use for all tests')
		.option('-c, --config [value]', 'Path to config file used to test. Defaults to ./test/smoke.json')
		.option('-i, --interactive [value]', 'Interactively choose which tests to run. Defaults to false')
		.description('Tests that a given set of urls for an app respond as expected. Expects the config file ./test/smoke.json to exist')
		.action((sets, opts) => {
			smokeTests.run(opts, sets).catch(err => {
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
