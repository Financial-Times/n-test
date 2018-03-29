const webdriverio = require('webdriverio');
const getSeleniumGrid = require('./get-selenium-grid');

const DIMENSIONS = {
	'XL': { width: 1220, height: 720 },
	'L': { width: 1024, height: 768 },
	'M': { width: 768, height: 1024 },
	'S': { width: 540, height: 960 },
	'default': { width: 320, height: 480, deviceScaleFactor: 2 }
};


class WebdriverPage {
	constructor (options, browserName) {
		this.browserOptions = getSeleniumGrid(browserName);
		this.type = browserName;
		this.browser = webdriverio.remote(this.browserOptions);
		this.url = options.url;

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

		//skip tests which are user based, because we can't set the FT-Test-Host header
		if(this.method !== 'GET' || this.user) {
			return;
		}

		if(this.requestHeaders) {

			//Webdriver only lets you set cookies on the current page, so visit the page.
			await this.browser.url(this.url.toString());

			//Translate request headers into cookies if we know about them
			Object.entries(this.requestHeaders).forEach(([key, value]) => {
				if(key.toLowerCase() === 'ft-flags') {
					this.browser.setCookie({ name: 'next-flags', value: encodeURIComponent(value) });
				}
			});
		}

		await this.browser.url(this.url.toString());
	}

	async getVisibleElements (selector) {
		const response = await this.browser.isVisible(selector);
		return [].concat(response).filter(a => a).length;
	}

	async getElementText (selector) {
		return await this.browser.getText(selector);
	}

	async close () {
		this.browser.end();
	}

};

module.exports = WebdriverPage;
