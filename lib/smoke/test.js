/* globals , beforeAll, afterAll, test, expect */
const puppeteer = require('puppeteer');

const config = require(process.env.SMOKE_CONFIG);

const host = process.env.SMOKE_HOST || 'http://localhost:3002';

let browser;
let page;

const setup = async () => {
	browser = await puppeteer.launch();
	page = await browser.newPage();
};

const teardown = async () => {
	await browser.close();
};

const verifyCacheHeaders = (headers, path) => {


	const cacheErrors = [];

	console.log(headers);

	if (!headers['surrogate-control'] && !headers['cache-control']) {
		cacheErrors.push(`Each ${path} should specify a Cache-Control and/or a Surrogate-Control header`);
	}
	if (headers['cache-control'] && headers['cache-control'].includes('private')) {
		if (headers['surrogate-control'] && !headers['surrogate-control'].includes('max-age=0')) {
			cacheErrors.push(`${path} has a private cache-control, which will mean surrogate-control gets ignored by fastly`);
		}
	} else {
		if (headers['surrogate-control'] && !(headers['surrogate-control'].includes('stale-while-revalidate')|| headers['surrogate-control'].includes('stale-if-error'))) {
			cacheErrors.push(`${path} should specify stale-while-revalidate and stale-if-error cache headers`);
		}

		if (!headers['surrogate-control'] || !headers['cache-control']) {
			cacheErrors.push(`Cachable path ${path} should specify both a Cache-Control and a Surrogate-Control header`);
		}

		if (headers['cache-control'] && headers['cache-control'].includes('public') && /max-age=[^0]/.test(headers['cache-control'])) {
			cacheErrors.push(`${path} should not have a public Cache-Control header of max-age greater than 0`);
		}

		if (headers['surrogate-control'] && !headers['cache-control']) {
			cacheErrors.push(`As ${path} uses surrogate-control, you should set an aoutbound cache-control header too, usually res.set('Cache-Control', res.FT_NO_CACHE)`)
		}
	}

	if (cacheErrors.length) {
		console.error(cacheErrors.join('\n')); // eslint-disable-line no-console
		// eslint-disable-next-line no-console
		console.error(`\
n-express contains a few helpful cache constants you can use to rectify these issues:
res.FT_NO_CACHE = 'max-age=0, no-cache, no-store, must-revalidate';
res.FT_SHORT_CACHE = 'max-age=600, stale-while-revalidate=60, stale-if-error=86400';
res.FT_HOUR_CACHE = 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400';
res.FT_DAY_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=86400';
res.FT_LONG_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=259200';
e.g. res.set('Cache-Control', res.FT_NO_CACHE).set('Surrogate-Control', res.FT_HOUR_CACHE);
`);
		throw new Error('Unwise Cache headers');
	}
};

describe('Smoke Tests', () => {
	beforeAll(setup);
	afterAll(teardown);


	config.forEach((conf) => {
		Object.keys(conf.urls).forEach(url => {
			let test = conf.urls[url];
			if(typeof test !== 'object') {
				test = { status: test };
			}

			describe(url, () => {
				let response;
				let headers;
				let coverageReports;

				beforeAll(async () => {
					if(test.cssCoverage) {
						page.coverage.startCSSCoverage();
					}

					if(process.env.SMOKE_AUTHENTICATE) {
						await page.setExtraHTTPHeaders({
							'FT-Next-Backend-Key': process.env.FT_NEXT_BACKEND_KEY
						});
					}

					if(config.headers) {
						await page.setExtraHTTPHeaders(config.headers);
					}

					if(test.headers) {
						await page.setExtraHTTPHeaders(test.headers);
					}

					response = await page.goto(`${host}${url}`);
					headers = response.headers();
				});

				if (test.status) {
					it(`should return a ${test.status}`, async () => {
						const status = await response.status();
						expect(status).toEqual(test.status);
					});
				}

				if (test.content) {
					it('should validate content', async () => {
						const content = await page.content();
						expect(test.content(content)).toBeTruthy();
					});
				}

				if (test.cacheHeaders) {
					it('should specify sensible cache headers', () => {
						expect(verifyCacheHeaders.bind(null, headers, url)).not.toThrow();
					});
				}


				if (test.cssCoverage) {

					test.cssCoverage.forEach(css => {

						it(`should be using at least ${css.threshold}% of ${css.url}`, async () => {

							coverageReports = coverageReports || await page.coverage.stopCSSCoverage();
							const cssFile = coverageReports.find(report => report.url.includes(css.url));

							if (cssFile) {
								const totalUsed = cssFile.ranges.reduce((current, range) => {
									return current + (range.end - range.start);
								}, 0);

								const percentage = Number(((totalUsed / cssFile.text.length) * 100).toFixed(1));
								// eslint-disable-next-line no-console
								console.info(`CSS coverage for ${cssFile.url}: ${percentage}%`);
								expect(percentage).toBeGreaterThan(css.threshold);
							} else {
								throw new Error('No coverage report found for URL that includes: ' + css.url);
							}
						});
					});
				}

			});
		});
	});
});
