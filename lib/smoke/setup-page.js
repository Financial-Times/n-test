const { URL } = require('url');

module.exports = (path, urlOpts, suiteOpts, globalOpts) => {
	const options = typeof urlOpts === 'object' ? Object.assign({}, urlOpts) : { status: urlOpts };
	let host = globalOpts.host || 'http://localhost:3002';

	if (!/https?\:\/\//.test(host)) {
		host = 'http://' + host;
	}

	options.requestHeaders = Object.assign({}, globalOpts.headers || {}, suiteOpts.headers || {}, urlOpts.headers || {});
	options.requestHeaderPaths = urlOpts.requestHeaderPaths || suiteOpts.requestHeaderPaths || [];

	options.method = urlOpts.method || suiteOpts.method;
	options.body = urlOpts.body || suiteOpts.body;
	options.user = suiteOpts.user;
	options.https = urlOpts.https || suiteOpts.https;
	options.breakpoint = urlOpts.breakpoint || suiteOpts.breakpoint || globalOpts.breakpoint;

	const browsers = urlOpts.browsers || suiteOpts.browsers;
	const enabledBrowsers = globalOpts.browsers || ['chrome', 'firefox', 'safari', 'internet explorer', 'MicrosoftEdge'];

	options.browsersToRun = ['chrome'];
	if(Array.isArray(browsers)) {
		options.browsersToRun = browsers.filter(browser => enabledBrowsers.includes(browser));
	} else if (browsers === true) {
		options.browsersToRun = enabledBrowsers;
	}

	if(options.user && !host.includes('local')) {
		options.requestHeaders['FT-Test-Host'] = host.replace('https://', '').replace('http://', '');
		host = 'https://www.ft.com';
	} else if (options.user) {
		//eslint-disable-next-line
		console.warn('Cannot run user based tests on local URLs, as they rely on the FT-Test-Host. To run this locally, please use ngrok');
		options.user = false;
	}

	options.url = new URL(path, host);

	if(options.https) {
		options.url.protocol = 'https';
	}

	return options;

};
