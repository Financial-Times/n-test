const openSmokeTests = require('../lib/smoke/open');

module.exports = (program) => {
	program
		.command('open [sets...]')
		.option('-a', '--auth', 'Authenticate with FT_NEXT_BACKEND_KEY')
		.option('-b, --breakpoint [value]', 'o-grid breakpoint to set viewport to')
		.option('-c, --config [value]', 'Path to config file used to test. Defaults to ./test/smoke.js')
		.option('-h, --host [value]', 'Set the hostname to use for all tests')

		.description('Starts an instance of Chromium with all the URLs from the smoke test open')
		.action(openSmokeTests);
};
