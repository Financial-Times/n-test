const REDIRECT_CODES = [301, 302, 303, 307, 308];

class URLTest {

	constructor (url, options) {
		this.browser = null;
		this.url = url;

		this.requestHeaders = options.headers;
		this.check = {
			status: options.status,
			cssCoverage: options.cssCoverage,
			pageErrors: options.pageErrors,
			cacheHeaders: options.cacheHeaders,
			content: options.content
		};

		this.pageErrors = [];
		this.consoleMessages = [];
		this.coverageReports = [];
		this.redirects = [];
		this.response = null;
		this.headers = null;
	}

	async init (browser) {
		this.browser = browser;
		this.page = await this.browser.newPage();
		if(this.check.cssCoverage) {
			this.page.coverage.startCSSCoverage();
		}

		if(process.env.SMOKE_AUTHENTICATE === true && process.env.FT_NEXT_BACKEND_KEY) {
			await this.page.setExtraHTTPHeaders({
				'FT-Next-Backend-Key': process.env.FT_NEXT_BACKEND_KEY
			});
		}

		if(this.requestHeaders) {
			await this.page.setExtraHTTPHeaders(this.opts.headers);
		}

		this.page.on('pageerror', (message) => {
			this.pageErrors.push(message);
		});

		this.page.on('console', (message) => {
			this.consoleMessages.push(message);
		});


		this.page.on('response', response => {
			const request = response.request();
			const status = response.status();

			// if this response is a redirect
			if (REDIRECT_CODES.includes(status)) {
				this.redirects[request.url()] = {
					code: status,
					to: response.url()
				};
			}
		});

		this.response = await this.page.goto(this.url, { waitUntil: 'load'});
		this.headers = this.response.headers();
		if(this.check.cssCoverage) {
			this.coverageReports = await this.page.coverage.stopCSSCoverage();
		}

	}

	get status () {
		return REDIRECT_CODES.includes(this.check.status) ?
			this.redirects[this.url].code :
			this.response.status();
	}

	coverageFor (url) {
		const cssFile = this.coverageReports.find(report => report.url.includes(url));
		if (cssFile) {
			const totalUsed = cssFile.ranges.reduce((current, range) => {
				return current + (range.end - range.start);
			}, 0);
			return Number(((totalUsed / cssFile.text.length) * 100).toFixed(1));
		} else {
			return false;
		}

	}
};

module.exports = URLTest;
