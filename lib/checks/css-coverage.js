module.exports = (testPage) => {
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
};
