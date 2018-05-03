const getUserTokens = require('./get-user-tokens');
const setSessionCookies = require('./set-session-cookies');
const { URL } = require('url');

const REDIRECT_CODES = [301, 302, 303, 307, 308];

const DIMENSIONS = require('../helpers/dimensions');

class PuppeteerPage {

	constructor (options) {
		this.browser = null;
		this.type = 'Chrome';
		this.url = options.url;
		this.url.hash = '';
		this.host = options.url.host;

		this.requestHeaders = Object.assign({}, options.requestHeaders || {});
		this.method = options.method || 'GET';
		this.postData = options.body || null;
		this.dimensions = DIMENSIONS[options.breakpoint] || DIMENSIONS['XL'];
		this.user = options.user || null;
		this.requestHeaderPaths = [this.url.toString()].concat(options.requestHeaderPaths || []);


		this.pageErrors = [];
		this.consoleMessages = [];
		this.coverageReports = [];
		this.redirects = [];
		this.requests = [];
		this.response = null;

		this.check = {};

		Object.entries(options).forEach(([name, val]) => {
			const reserved = ['waitUntil', 'https', 'requestHeaders', 'method', 'body', 'breakpoint', 'user'];
			if(!reserved.includes(name)) {
				this.check[name] = val;
			}
		});

		this.waitUntil = options.waitUntil || 'domcontentloaded';
	}

	async init (browser) {
		this.browser = browser;
		this.page = await this.browser.newPage();

		//clear cookies for each page request
		const cookies = await this.page.cookies(this.url);
		await Promise.all(cookies.map(cookie => this.page.deleteCookie(cookie)));

		if(this.check.status === 204) {
			return;
		}

		if (this.user) {
			const tokens = await getUserTokens(this.user);
			await setSessionCookies(this.page, this.url.toString(), tokens);
		}

		this.page.setViewport(this.dimensions);


		if(this.check.cssCoverage) {
			this.page.coverage.startCSSCoverage();
		}

		if(this.requestHeaders) {
			for (const header in this.requestHeaders) {
				if (this.requestHeaders.hasOwnProperty(header)) {
					this.requestHeaders[header] = this.requestHeaders[header].toString();
				}
			}
		}

		this.page.on('pageerror', (message) => {
			this.pageErrors.push(message);
		});

		this.page.on('console', (message) => {
			this.consoleMessages.push(message);
		});

		// Intercept page requests, we need to do this in order
		// to set the HTTP method or post data
		await this.page.setRequestInterception(true);

		//Occasionally the page load event takes longer than 30seconds (because ads etc), so allow for longer.
		this.page.setDefaultNavigationTimeout(60000);

		// Intercept requests so we can set the HTTP method
		// and post data. We only want to make changes to the
		// first request that's handled, which is the request
		// for the page we're testing
		let interceptionHandled = false;

		this.page.on('request', interceptedRequest => {
			const overrides = {};
			const url = interceptedRequest.url();

			// For user requests, only apply the request headers to the initial URL request, and any whitelisted paths. This is so that requests to other apps don't try and proxy to the app under test.
			if(this.user) {
				if(this.requestHeaderPaths.find(path => new RegExp(path).test(url))) {
					overrides.headers = Object.assign({}, this.requestHeaders);
				}
			} else {
				//Otherwise apply headers for any URls with the same host
				if(new URL(url).host === this.url.host) {
					overrides.headers = Object.assign({}, this.requestHeaders);
				}
			}

			if (!interceptionHandled) {

				overrides.method = this.method;
				// Override the request POST data if present
				if (this.postData) {
					if(typeof this.postData === 'object') {
						this.postData = JSON.stringify(this.postData);
					}
					overrides.postData = this.postData;

					if(!overrides.headers['Content-Type']) {
						overrides.headers['Content-Type'] = 'application/json';
					}
				}

				interceptionHandled = true;
			}
			interceptedRequest.continue(overrides);
		});


		this.page.on('response', response => {
			const request = response.request();
			const status = response.status();
			const url = request.url();
			if(url !== this.url.toString()) {
				this.requests.push({ url, status });
			} else if (!this.response) {
				this.response = response;
			}
			//if this response is a redirect, log it
			if(REDIRECT_CODES.includes(status)) {
				this.redirects[url] = {
					code: status,
					to: response.headers().location
				};
			}
		});

		const gotoResponse = await this.page.goto(this.url.toString(), { waitUntil: this.waitUntil });
		this.response = this.response || gotoResponse;

		if(this.check.cssCoverage) {
			this.coverageReports = await this.page.coverage.stopCSSCoverage();
		}

		return this;
	}

	get status () {
		return REDIRECT_CODES.includes(this.check.status) && this.redirect ?
			this.redirects[this.url.toString()].code :
			this.response.status();
	}

	get redirect () {
		return this.redirects[this.url.toString()];
	}

	async getVisibleElements (selector) {
		return await this.page.$$eval(selector, els => els.filter(el => {
			//Filter out elements that are not visible
			const rect = el.getBoundingClientRect();
			return rect.height > 0 && rect.width > 0;
		}).length);
	}

	async getElementText (selector) {
		return await this.page.$eval(selector, el => el.innerText);
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
		return this.page.close();
	}

	async screenshot (fileName) {
		return this.page.screenshot({ path: fileName, fullPage: true});
	}

};

module.exports = PuppeteerPage;
