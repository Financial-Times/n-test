module.exports = (testPage) => {
	//eslint-disable-next-line no-console
	console.info('Errors on page: ' + testPage.pageErrors);
	return {
		expected: `no more than ${testPage.check.pageErrors} console errors`,
		actual: `${testPage.pageErrors.length} errors`,
		result: testPage.pageErrors.length <= testPage.check.pageErrors
	};
};
