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
		'browser_version': '60'
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
		'browser_version' : 'latest'
	}
};

module.exports = async (browserName) => {
	if (process.env.BROWSERSTACK_USER && process.env.BROWSERSTACK_KEY) {
		const desiredCapabilities = browserMap[browserName] || { browserName };
		return {
			desiredCapabilities,
			user: process.env.BROWSERSTACK_USER,
			key: process.env.BROWSERSTACK_KEY
		};
	}

};
