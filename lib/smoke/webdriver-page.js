const webdriverio = require('webdriverio');
const getBrowserstackConfig = require('./get-browserstack-config');


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
			elements: options.elements,
			screenshot: options.screenshot
		};


		this.waitUntil = options.waitUntil || 'domcontentloaded';

	}

	async init () {

		this.browserOptions = await getBrowserstackConfig(this.type);
		if (!this.browserOptions || //skip if no environment variables
			this.isAutomatedTest && !(this.check.elements || this.check.screenshot)) {
			return;
		}

		this.browser = await webdriverio.remote(this.browserOptions);

		await this.browser.setWindowSize(this.dimensions.width, this.dimensions.height);

		//skip tests which are user based, because we can't set the FT-Test-Host header
		if (this.method !== 'GET' || this.user) {
			return;
		}

		if (this.requestHeaders) {

			//Webdriver only lets you set cookies on the current page, so visit the page.
			await this.browser.url(this.url.toString());

			//Translate request headers into cookies if we know about them
			for (const [key, value] of Object.entries(this.requestHeaders)) {
				if (key.toLowerCase() === 'ft-flags') {
					await this.browser.setCookies({name: 'next-flags', value: encodeURIComponent(value)});
				}
			}
		}

		return this.browser.url(this.url.toString());
	}

	async getVisibleElements (selector) {
		try {
			if (this.waitUntil !=='domcontentloaded') {
				await this.browser.waitUntil(() => this.browser.$$(selector).then(elements => !!elements.length), 10000, `No elements matching '${selector}' found`, 1000);
			}
			const els = await this.browser.$$(selector);
			const response = await Promise.all(els.map(el => el.isDisplayed().catch(() => false)));
			return response.filter(result => result).length;
		} catch (e) {
			console.log(e); //eslint-disable-line no-console
			return null;
		}
	}

	async getElementText (selector) {
		return this.browser.getText(selector);
	}

	async screenshot (fileName) {
		return this.browser.saveScreenshot(fileName);
	}

	async close () {
		if (this.browser) {
			await this.browser.deleteSession();
		}
	}

};

module.exports = WebdriverPage;
