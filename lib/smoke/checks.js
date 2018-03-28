module.exports = {
	status: (testPage) => {
		if (testPage.check.status === 204) {
			//eslint-disable-next-line no-console
			console.info('204 status checks are not supported yet!');
			return { expected: 204, actual: '¯\_(ツ)_/¯ ', result: true };
			return true;
		} else if (typeof testPage.check.status === 'string') {
			const redirectLocation = testPage.redirect.headers()['location'];
			return {
				expected: `redirect to ${testPage.check.status}`,
				actual: `redirect to ${redirectLocation}`,
				result: testPage.check.status === redirectLocation
			};
		} else {
			return { expected: testPage.check.status, actual: testPage.status, result: testPage.status === testPage.check.status || testPage.status === 304 && testPage.check.status === 200 };
		}
	},

	pageErrors: (testPage) => {
		//eslint-disable-next-line no-console
		console.info('Errors on page: ' + testPage.pageErrors);
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
			//eslint randomly started failing this, even though it is guarded!
			//eslint-disable-next-line guard-for-in
			for(const selector in testPage.check.elements) {
					if(testPage.check.elements.hasOwnProperty(selector)) {
					const assertion = testPage.check.elements[selector];
					//If we're expecting an element, wait for it.
					if(!!assertion > 0) {
						await testPage.page.waitForSelector(selector);
					}

					if(typeof assertion === 'number') {
						const count = await testPage.getVisibleElements(selector);
						results.push({
							expected: `should have ${assertion} visible elements matching selector ${selector}`,
							actual: count,
							result: count === assertion
						});

					} else if (typeof assertion === 'boolean') {
						const count = await testPage.getVisibleElements(selector);
						results.push({
							expected: `should ${assertion ? 'have ' : 'not have '} visible elements matching selector ${selector}`,
							actual: count,
							result: !!count === assertion
						});
					} else if (typeof assertion === 'string') {

							const elText = await testPage.getElementText(selector);
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
	},

	networkRequests: (testPage) => {
		const expected = testPage.check.networkRequests;
		const results = [];
		Object.entries(expected).forEach(([url, count]) => {
			const matches = testPage.requests.filter(req => req.url.includes(url));
			if(typeof count === 'number') {
				results.push({
					expected: `${count} network requests to URL matching ${url}`,
					actual: `${matches.length} requests`,
					result: matches.length === count
				});
			} else if (typeof count === 'boolean') {
				results.push({
					expected: `${ count ? 'At least one network request' : 'No network requests' } to URL matching ${url}`,
					actual: matches.length,
					result: !!matches.length === count
				});
			}
		});
		return results;
	},

	responseHeaders: (testPage) => {
		const expected = testPage.check.responseHeaders;
		const headers = testPage.response.headers();
		const results = [];
		Object.entries(expected).forEach(([name, value]) => {
			const match = headers[name.toLowerCase()];
			results.push({
				expected: `Response Header ${name} should equal ${value}`,
				actual: match,
				result: match === value
			});
		});
		return results;

	}


};
