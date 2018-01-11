
const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');


module.exports.run = (opts) => {
	const testFile = path.join(path.dirname(fs.realpathSync(__filename)), 'test.js');
	const configFile = opts.config || path.join(process.cwd(), 'smoke.json');

	if (!fs.existsSync(configFile)) {
		throw new Error(`Config file for smoke test does not exist at ${configFile}. Either create a config file at ./test/smoke.json, or pass in a path using --config.`);
	} else {
		const command = spawn('./node_modules/.bin/mocha', [testFile, '--exit'], {
			stdio: 'inherit',
			env: Object.assign({}, process.env, {
				SMOKE_HOST: opts.host,
				SMOKE_CONFIG: configFile
			})
		});
	}
};

