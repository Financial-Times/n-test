module.exports = (testPage) => {
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

};