const webdriverio = require('webdriverio');

const getUserTokens = require('./get-user-tokens');
const setSessionCookies = require('./set-session-cookies');

const DIMENSIONS = {
	'XL': { width: 1220, height: 720 },
	'L': { width: 1024, height: 768 },
	'M': { width: 768, height: 1024 },
	'S': { width: 540, height: 960 },
	'default': { width: 320, height: 480, deviceScaleFactor: 2 }
};

const WAIT_TIME = 5000;

class WebdriverPage {
	constructor (url, options, browserName) {
		this.browserOptions = {
			desiredCapabilities: { browserName },
			user: process.env.SAUCE_USER,
			key: process.env.SAUCE_KEY,
			host: 'ondemand.saucelabs.com'
		};
		this.type = browserName;
		this.browser = webdriverio.remote(this.browserOptions);
		this.url = url;

		if(options.https) {
			this.url = this.url.replace('http:', 'https:');
		}

		//TODO: map request headers to cookies where applicable (FTSession, next-flags)
		this.requestHeaders = Object.assign({}, options.requestHeaders || {});
		this.method = options.method || 'GET';
		this.dimensions = DIMENSIONS[options.breakpoint] || DIMENSIONS['XL'];
		this.user = options.user || null;

		this.check = {
			elements: options.elements
		};

	}

	async init () {

		if(!this.check.elements) {
			return;
		}

		await this.browser.init();

		Object.entries(this.requestHeaders).forEach(([key, value]) => {
			if(key.toLowerCase() === 'ft-flags') {
				this.browser.setCookie({ name: 'next-flags', value: encodeURIComponent(value) });
			}
		});

		if(this.method !== 'GET') {
			return;
		}

		if (this.user) {
			const tokens = await getUserTokens(this.user);
			await setSessionCookies(this.browser, this.url, tokens);
		}

		await this.browser.url(this.url);
	}

	async getVisibleElements (selector) {
		await this.browser.waitForVisible(selector, WAIT_TIME);
		const response = await this.browser.isVisible(selector);
		return [].concat(response).filter(a => a).length;
	}

	async getElementText (selector) {
		await this.browser.waitForVisible(selector, WAIT_TIME);
		return await this.browser.getText(selector);
	}

	async close () {
		this.browser.end();
	}

};

module.exports = WebdriverPage;
