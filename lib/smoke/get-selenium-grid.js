const browserMap = {
	'chrome': {
		'browserName': 'Chrome'
	},
	'internet explorer': {
		'browserName': 'IE',
		'browser_version': 11
	},
	'firefox': {
		'browserName': 'Firefox'
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

module.exports = (browserName) => {

	const config = {};

	if (process.env.BROWSERSTACK_USER && process.env.BROWSERSTACK_KEY) {
		config.desiredCapabilities = browserMap[browserName] || { browserName };
		config.user = process.env.BROWSERSTACK_USER;
		config.key = process.env.BROWSERSTACK_KEY;
	} else if(process.env.SAUCE_USER && process.env.SAUCE_KEY) {
		config.desiredCapabilities = { browserName };
		config.user = process.env.SAUCE_USER;
		config.key =process.env.SAUCE_KEY;
		config.host = 'ondemand.saucelabs.com';
		config.services = ['sauce'];
	}
	return config;
};
