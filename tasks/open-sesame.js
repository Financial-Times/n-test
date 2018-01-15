const openSmokeTests = require('../lib/smoke/open');

module.exports = (program) => {
	program
		.command('open-smoke')
		.option('-a', '--auth', 'Authenticate with FT_NEXT_BACKEND_KEY')
		.option('-h, --host [value]', 'Set the hostname to use for all tests')
		.option('-c, --config [value]', 'Path to config file used to test. Defaults to ./test/smoke.json')
		.description('Tests that a given set of urls for an app respond as expected. Expects the config file ./test/smoke.json to exist')
		.action(openSmokeTests);
};
