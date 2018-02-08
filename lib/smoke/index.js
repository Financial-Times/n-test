const path = require('path');
const fs = require('fs');

const test = require('./test');
const filterConfigs = require('./filter-configs');

module.exports.run = async (opts, sets) => {
	const configFile = path.join(process.cwd(), opts.config || 'test/smoke.js');
	if (!fs.existsSync(configFile)) {
		throw new Error(`Config file for smoke test does not exist at ${configFile}. Either create a config file at ./test/smoke.js, or pass in a path using --config.`);
	} else {

		let host = opts.host || 'http://localhost:3002';

		if (!/https?\:\/\//.test(host)) {
			host = 'http://' + host;
		}

		const configsToRun = await filterConfigs(configFile, sets, opts.interactive);

		return test(configsToRun, host, opts.auth);
	}
};
