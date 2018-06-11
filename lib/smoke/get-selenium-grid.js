const browserstack = require('browserstack-local');

let bsLocal = null; //share bsLocal between test runs

const browserMap = {
	'chrome': {
		'browserName': 'Chrome',
		'browser_version': 'latest'
	},
	'internet explorer': {
		'browserName': 'IE',
		'browser_version': 11,
	},
	'ie11': {
		'browserName': 'IE',
		'browser_version': 11,
	},
	'ie10': {
		'browserName': 'IE',
		'browser_version': 10,
	},
	'ie9': {
		'browserName': 'IE',
		'browser_version': 9,
	},
	'firefox': {
		'browserName': 'Firefox',
		'browser_version': 'latest'
	},
	'iphone': {
		'os_version' : '11.0',
		'device' : 'iPhone 8',
		'real_mobile' : 'true'
	},
	'android': {
		'device' : 'Samsung Galaxy S8',
		'real_mobile': true
	},
	'safari': {
		'os_version' : 'High Sierra',
		'browserName' : 'Safari',
		'browser_version' : '11.0'
	}
};

const getLocalBrowserstack = async () => {
	return new Promise((resolve, reject) => {
		const local = new browserstack.Local();
		local.start({'key': process.env.BROWSERSTACK_KEY }, (error) => {
			if (error) {
				return reject(error);
			}
			resolve(local);
		});
	});
};

module.exports = async (browserName, isLocal) => {
	if (process.env.BROWSERSTACK_USER && process.env.BROWSERSTACK_KEY) {
		const desiredCapabilities = browserMap[browserName] || { browserName };
		if(isLocal) {
			desiredCapabilities['browserstack.local'] = true;
			bsLocal = bsLocal || getLocalBrowserstack();
		}
		return {
			desiredCapabilities,
			bs_local: await bsLocal,
			user: process.env.BROWSERSTACK_USER,
			key: process.env.BROWSERSTACK_KEY
		};
	} else if(process.env.SAUCE_USER && process.env.SAUCE_KEY) {
		return {
			desiredCapabilities: { browserName },
			user: process.env.SAUCE_USER,
			key: process.env.SAUCE_KEY,
			host: 'ondemand.saucelabs.com',
			services: ['sauce']
		};
	}

};

module.exports.cleanup = async () => {
	if(bsLocal) {
		const local = await bsLocal;
		local && local.stop(() => {});
	}
};
