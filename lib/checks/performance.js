module.exports = async (testPage) => {
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
};
