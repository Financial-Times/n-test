const REDIRECT_CODES = [301, 302, 303, 307, 308];
const webdriverio = require('webdriverio');

const DIMENSIONS = {
	'XL': { width: 1220, height: 720 },
	'L': { width: 1024, height: 768 },
	'M': { width: 768, height: 1024 },
	'S': { width: 540, height: 960 },
	'default': { width: 320, height: 480, deviceScaleFactor: 2 }
};

class WebdriverPage {
	constructor (url, options) {
		this.browserOptions = {
			desiredCapabilities: { browserName: 'chrome' }
		};
		this.type = 'Selenium';
		this.browser = webdriverio.remote(this.browserOptions);
		this.url = url;

		if(options.https) {
			this.url = this.url.replce('http:', 'https:');
		}

		this.requestHeaders = Object.assign({}, options.requestHeaders || {});
		this.method = options.method || 'GET';
		this.postData = options.body || null;
		this.dimensions = DIMENSIONS[options.breakpoint] || DIMENSIONS['XL'];

		this.response = null;

		this.check = {
			elements: options.elements
		}
	}

	async init () {

		if(!this.check.elements) {
			return;
		}

		await this.browser.init();

		if(this.method !== 'GET') {
			return;
		}

		await this.browser.url(this.url);
		const title = await this.browser.getTitle();
	}

	get status () {
		return
	}

	get redirect () {
		return this.redirects[this.url];
	}

	async getVisibleElements(selector) {
		const response = await this.browser.isVisible(selector);
		return [].concat(response).filter(a => a).length;
	}

	async getElementText(selector) {
		return await this.browser.getText(selector);
	}

	coverageFor (url) {
		const cssFile = this.coverageReports.find(report => report.url.endsWith(url));
		if (cssFile) {
			const totalUsed = cssFile.ranges.reduce((current, range) => {
				return current + (range.end - range.start);
			}, 0);
			return Number(((totalUsed / cssFile.text.length) * 100).toFixed(1));
		} else {
			return false;
		}
	}

	async close () {
		this.browser.end();
	}

};

module.exports = WebdriverPage;
