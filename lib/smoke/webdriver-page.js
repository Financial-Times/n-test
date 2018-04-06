const webdriverio = require('webdriverio');
const getSeleniumGrid = require('./get-selenium-grid');


const DIMENSIONS = require('../helpers/dimensions');

class WebdriverPage {
	constructor (options, browserName, isAutomatedTest) {
		this.type = browserName;
		this.url = options.url;

		this.isAutomatedTest = isAutomatedTest;

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

		if(this.isAutomatedTest && !this.check.elements) {
			return;
		}
		this.browserOptions = await getSeleniumGrid(this.type, this.url.host.startsWith('local'));
		this.browser = webdriverio.remote(this.browserOptions);

		await this.browser.init();

		await this.browser.setViewportSize(this.dimensions);

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

		return await this.browser.url(this.url.toString());
	}

	async getVisibleElements (selector) {
		const response = await this.browser.isVisible(selector);
		return [].concat(response).filter(a => a).length;
	}

	async getElementText (selector) {
		return await this.browser.getText(selector);
	}

	async screenshot () {
		return await this.browser.saveScreenshot();
	}

	async close () {
		this.browser.end();
	}

};

module.exports = WebdriverPage;
