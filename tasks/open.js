const openSmokeTests = require('../lib/smoke/open');

module.exports = (program) => {

	const collectHeaders = (val, memo) => {
		memo.push(val);
		return memo;
	};

	program
		.command('open [sets...]')
		.option('-b, --breakpoint [value]', 'o-grid breakpoint to set viewport to')
		.option('-c, --config [value]', 'Path to config file used to test. Defaults to ./test/smoke.js')
		.option('-H, --host [value]', 'Set the hostname to use for all tests')
		.option('--header [value]', 'Request headers to be sent with every request. e.g. "X-Api-Key: 1234"', collectHeaders, [])

		.description('Starts an instance of Chromium with all the URLs from the smoke test open')
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

			openSmokeTests(opts, sets);
		});
};
