const getUserTokens = require('./get-user-tokens');
const setSessionCookies = require('./set-session-cookies');
const { URL } = require('url');

const REDIRECT_CODES = [301, 302, 303, 307, 308];

const DIMENSIONS = {
	'XL': { width: 1220, height: 720 },
	'L': { width: 1024, height: 768 },
	'M': { width: 768, height: 1024 },
	'S': { width: 540, height: 960 },
	'default': { width: 320, height: 480, deviceScaleFactor: 2 }
};

class PuppeteerPage {

	constructor (url, options) {
		this.browser = null;
		this.type = 'Chrome';
		this.url = url;
		this.host = options.host;

		if(options.https) {
			this.url = this.url.replace('http:', 'https:');
		}

		this.requestHeaders = Object.assign({}, options.requestHeaders || {});
		this.method = options.method || 'GET';
		this.postData = options.body || null;
		this.dimensions = DIMENSIONS[options.breakpoint] || DIMENSIONS['XL'];
		this.user = options.user || null;
		this.requestHeaderPaths = [this.url].concat(options.requestHeaderPaths || []);


		this.pageErrors = [];
		this.consoleMessages = [];
		this.coverageReports = [];
		this.redirects = [];
		this.requests = [];
		this.response = null;

		this.check = {};

		Object.entries(options).forEach(([name, val]) => {
			//Assume anything in options we haven't already claimed is an assertion to check
			const reserved = ['https', 'requestHeaders', 'method', 'body', 'breakpoint', 'user'];
			if(!reserved.includes(name)) {
				this.check[name] = val;
			}
		});
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
			await setSessionCookies(this.page, this.url, tokens);
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

		// Intercept requests so we can set the HTTP method
		// and post data. We only want to make changes to the
		// first request that's handled, which is the request
		// for the page we're testing
		let interceptionHandled = false;

		this.page.on('request', interceptedRequest => {
			const overrides = {};
			const url = interceptedRequest.url();

			// For user requests, only apply the request headers to the initial URL request, and any whitelisted paths
			if(this.user) {
				if(this.requestHeaderPaths.find(path => new RegExp(path).test(url))) {
					overrides.headers = Object.assign({}, this.requestHeaders);
				}
			} else {
				//Otherwise apply headers for any URls with the same host
				if(new URL(url).host === new URL(this.url).host) {
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

			if(url !== this.url) {
				this.requests.push({ url, status });
			} else if (!this.response) {
				this.response = response;
			}
			// if this response is a redirect
			if (REDIRECT_CODES.includes(status)) {
				this.redirects[url] = {
					code: status,
					to: response.headers().location
				};
			}
		});

		const waitUntil = (this.check.elements || this.check.networkRequests) ? 'load' : 'domcontentloaded';
		this.response = await this.page.goto(this.url, { waitUntil });

		// So horrible - because we have request interception turned on, I *think* this.response is sometimes null if it comes back before request.continue();
		// If this happens, wait for the response interception to have stored it
		if(!this.response) {
			this.response = await this.waitForResponse();
		}

		if(this.check.cssCoverage) {
			this.coverageReports = await this.page.coverage.stopCSSCoverage();
		}




	}

	async waitForResponse () {
		return new Promise((resolve) => {
			const poll = setInterval(() => {
				if(this.response && this.response.status) {
					clearInterval(poll);
					resolve(this.response);
				}
			}, 50);
		});
	}

	get status () {
		return REDIRECT_CODES.includes(this.check.status) ?
			this.redirects[this.url].code :
			this.response.status();
	}

	get redirect () {
		return this.redirects[this.url];
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

};

module.exports = PuppeteerPage;
