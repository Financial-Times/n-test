const smokeTests = require('../lib/smoke');

module.exports = (program) => {
	program
		.command('smoke')
		.option('-a', '--auth', 'Authenticate with FT_NEXT_BACKEND_KEY')
		.option('-h, --host [value]', 'Set the hostname to use for all tests')
		.option('-c, --config [value]', 'Path to config file used to test. Defaults to ./test/smoke.json')
		.description('Tests that a given set of urls for an app respond as expected. Expects the config file ./test/smoke.json to exist')
		.action((opts) => {
			smokeTests.run(opts).catch(err => {
				if(err.failed) {
					console.error(`${err.failed.length} URLs failed their check.`);
				} else {
					console.error(err);
				}
				process.exit(0);
			})
		});
};
