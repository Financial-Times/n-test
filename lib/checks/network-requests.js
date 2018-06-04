module.exports = (testPage) => {
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
};