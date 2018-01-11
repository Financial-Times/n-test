const path = require('path');
const fs = require('fs');
const Mocha = require('mocha');


module.exports.run = (opts) => {

	const mocha = new Mocha();

	const testFile = path.join(path.dirname(fs.realpathSync(__filename)), 'test.js');
	const configFile = opts.config || path.join(process.cwd(), 'smoke.json');

	if (!fs.existsSync(configFile)) {
		throw new Error(`Config file for smoke test does not exist at ${configFile}. Either create a config file at ./test/smoke.json, or pass in a path using --config.`);
	} else {

		process.env.SMOKE_CONFIG = configFile;
		process.env.SMOKE_HOST = opts.host || 'http://localhost:3002';
		mocha.addFile(testFile);

		return new Promise((resolve, reject) => {
			const runner = mocha.run();

			runner.on('end', () => {
				if(runner.failures) {
					reject({
						total: runner.total,
						failures: runner.failures
					});
				} else {
					resolve({
						total: runner.total,
						failures: runner.failures
					});
				}
			});
		});

	}
};

