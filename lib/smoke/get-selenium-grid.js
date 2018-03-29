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

	if (process.env.BROWSERSTACK_USER && process.env.BROWSERSTACK_KEY) {
		return {
			desiredCapabilities: browserMap[browserName] || { browserName },
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
