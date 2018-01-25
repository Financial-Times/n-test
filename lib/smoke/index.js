const path = require('path');
const fs = require('fs');

const test = require('./test');

module.exports.run = (opts) => {
	const configFile = path.join(process.cwd(), opts.config || 'test/smoke.js');
	if (!fs.existsSync(configFile)) {
		throw new Error(`Config file for smoke test does not exist at ${configFile}. Either create a config file at ./test/smoke.js, or pass in a path using --config.`);
	} else {

		let host = opts.host || 'http://local.ft.com:3002';

		if (!/:|\./.test(host)) {
			host += '.herokuapp.com';
		}

		if (!/https?\:\/\//.test(host)) {
			host = host.endsWith('.herokuapp.com') ? ('https://' + host) : ('http://' + host);
		}

		return test(configFile, host, opts.auth);
	}
};
