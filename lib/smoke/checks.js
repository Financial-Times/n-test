const verifyCacheHeaders = require('./verify-cache-headers');

module.exports = {
	status: (testPage) => {
		if (testPage.check.status === 204) {
			//eslint-disable-next-line no-console
			console.info('204 status checks are not supported yet!');
			return { expected: 204, actual: '¯\_(ツ)_/¯ ', result: true };
			return true;
		} else if (typeof testPage.check.status === 'string') {
			return {
				expected: `redirect to ${testPage.check.status}`,
				actual: `redirect to ${testPage.redirect.to}`,
				result: testPage.check.status === testPage.redirect.to
			};
		} else {
			return { expected: testPage.check.status, actual: testPage.status, result: testPage.status === testPage.check.status };
		}
	},

	pageErrors: (testPage) => {
		//eslint-disable-next-line no-console
		console.debug('Errors on page: ' + testPage.pageErrors);
		return {
			expected: `no more than ${testPage.check.pageErrors} console errors`,
			actual: `${testPage.pageErrors.length} errors`,
			result: testPage.pageErrors.length <= testPage.check.pageErrors
		};
	},

	content: async (testPage) => {
		const headers = testPage.response.headers();
		const isHTML = headers['content-Type'] && headers['content-Type'].includes('text/html');

		const content = isHTML ? await testPage.page.content() : await testPage.response.text();

		let validation;
		if(typeof testPage.check.content === 'function') {
			validation = testPage.check.content(content);
		} else {
			validation = (content).includes(testPage.check.content);
		}

		return {
			expected: 'Response content should validate against provided function',
			actual: validation,
			result: !!validation
		};
	},

		elements: async (testPage) => {
			const results = [];
			for(const selector in testPage.check.elements) {
					if(testPage.check.elements.hasOwnProperty(selector)) {
					const assertion = testPage.check.elements[selector];
					if(typeof assertion === 'number') {

						const count = await testPage.page.$$eval(selector, els => els.filter(el => {
							//Filter out elements that are not visible
							const rect = el.getBoundingClientRect();
							return rect.height > 0 && rect.width > 0;
						}).length);
						results.push({
							expected: `should have ${assertion} visible elements matching selector ${selector}`,
							actual: count,
							result: count === assertion
						});
					} else if(typeof assertion === 'string') {
							await testPage.page.waitForSelector(selector);
							const elText = await testPage.page.$eval(selector, el => el.innerText);
							results.push({
								expected: `element with selector selector ${selector} should contain text ${assertion}`,
								actual: elText,
								result: elText.includes(assertion)
							});
					}
				};

			}
			return results;
		},

	cacheHeaders: (testPage) => {
		let okay = true;
		let problems;
		try {
			verifyCacheHeaders(testPage.headers, testPage.url);
		} catch(errors) {
			okay = false;
			problems = errors;
		}
		return {
			expected: 'Cache-Control headers should be sensible',
			actual: okay || problems,
			result: okay
		};
	},

	cssCoverage: (testPage) => {
		const results = [];
		for(const url in testPage.check.cssCoverage) {
			if(testPage.check.cssCoverage.hasOwnProperty(url)) {
				const threshold = testPage.check.cssCoverage[url];
				const percentage = testPage.coverageFor(url);

				results.push({
					expected: `should be using at least ${threshold}% of the CSS in ${url}`,
					actual: percentage ? `${percentage}%` : 'No coverage report found',
					result: percentage >= threshold
				});
			}
		}

		return results;
	},

	performance: async (testPage) => {
		const threshold = Number.isInteger(testPage.check.performance) ? parseInt(testPage.check.performance) : 2000;
		const paints = await testPage.page.evaluate(() => {
			const result = {};
			performance.getEntriesByType('paint').map(entry => {
				result[entry.name] = entry.startTime;
			});
			return result;
		});

		return [
			{ expected: `First Paint to be less than ${threshold}ms`, actual: `${paints['first-paint']}ms`, result: paints['first-paint'] < threshold },
			{ expected: `First Contentful Paint to be less than ${threshold}ms`, actual: `${paints['first-contentful-paint']}ms`, result: paints['first-contentful-paint'] < threshold }
		];
	}


};
