const REDIRECT_CODES = [301, 302, 303, 307, 308];

const DIMENSIONS = {
	'XL': { width: 1220, height: 720 },
	'L': { width: 1024, height: 768 },
	'M': { width: 768, height: 1024 },
	'S': { width: 540, height: 960 },
	'default': { width: 320, height: 480, deviceScaleFactor: 2 }
};

class TestPage {

	constructor (url, options) {
		this.browser = null;
		this.url = url;

		if(options.https) {
			this.url = this.url.replce('http:', 'https:');
		}

		this.requestHeaders = Object.assign({}, options.requestHeaders || {});
		this.method = options.method || 'GET';
		this.postData = options.body || null;
		this.dimensions = DIMENSIONS[options.breakpoint] || DIMENSIONS['XL'];


		this.pageErrors = [];
		this.consoleMessages = [];
		this.coverageReports = [];
		this.redirects = [];
		this.requests = [];
		this.response = null;

		this.check = {};

		Object.entries(options).forEach(([name, val]) => {
			//Assume anything in options we haven't already claimed is an assertion to check
			const reserved = ['https', 'requestHeaders', 'method', 'body', 'breakpoint'];
			if(!reserved.includes(name)) {
				this.check[name] = val;
			}
		});
	}

	async init (browser) {
		console.log('browser', browser)
		this.browser = browser;
		this.page = await this.browser.newPage();


		//clear cookies for each page request
		const cookies = await this.page.cookies(this.url);
		await Promise.all(cookies.map(cookie => this.page.deleteCookie(cookie)));

		if(this.check.status === 204) {
			return;
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

			await this.page.setExtraHTTPHeaders(this.requestHeaders);
		}

		this.page.on('pageerror', (message) => {
			this.pageErrors.push(message);
		});

		this.page.on('console', (message) => {
			this.consoleMessages.push(message);
		});

		if(this.method !== 'GET') {
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
				if (!interceptionHandled) {

					overrides.method = this.method;
					// Override the request POST data if present
					if (this.postData) {
						if(typeof this.postData === 'object') {
							this.postData = JSON.stringify(this.postData);
						}
						overrides.postData = this.postData;
						overrides.headers = this.requestHeaders;

						if(!overrides.headers['Content-Type']) {
							overrides.headers['Content-Type'] = 'application/json';
						}
					}

					interceptionHandled = true;
				}
				interceptedRequest.continue(overrides);
			});

		}

		this.page.on('response', response => {
			const request = response.request();
			const status = response.status();
			const url = request.url();

			if(url !== this.url) {
				this.requests.push({ url, status });
			}
			// if this response is a redirect
			if (REDIRECT_CODES.includes(status)) {
				this.redirects[url] = {
					code: status,
					to: response.headers().location
				};
			}
		});

		const waitUntil = 'load';
		this.response = await this.page.goto(this.url, { waitUntil });
		if(this.check.cssCoverage) {
			this.coverageReports = await this.page.coverage.stopCSSCoverage();
		}

	}

	get status () {
		return REDIRECT_CODES.includes(this.check.status) ?
			this.redirects[this.url].code :
			this.response.status();
	}

	get redirect () {
		return this.redirects[this.url];
	}

	async getVisibleElements(selector) {
		return await this.page.$$eval(selector, els => els.filter(el => {
			//Filter out elements that are not visible
			const rect = el.getBoundingClientRect();
			return rect.height > 0 && rect.width > 0;
		}).length);
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

module.exports = TestPage;
