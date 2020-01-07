module.exports = (testPage) => {
	const expected = testPage.check.networkRequests;
	const results = [];

	Object.entries(expected).forEach(([url, value]) => {
		const matches = testPage.requests.filter(req => req.url.includes(url));

		if (typeof value === 'object' && value !== null) {
			const stringifiedExpectedBody = JSON.stringify(value);
			const stringifiedActualBody = JSON.stringify(matches[0].body);

			results.push({
				expected: `Response body of request to URL matching ${url} to equal ${stringifiedExpectedBody}`,
				actual: stringifiedActualBody,
				result: stringifiedActualBody === stringifiedExpectedBody
			});
		} else if(typeof value === 'number') {
			results.push({
				expected: `${value} network requests to URL matching ${url}`,
				actual: `${matches.length} requests`,
				result: matches.length === value
			});
		} else if (typeof value === 'boolean') {
			results.push({
				expected: `${ value ? 'At least one network request' : 'No network requests' } to URL matching ${url}`,
				actual: matches.length,
				result: !!matches.length === value
			});
		}
	});
	return results;
};
