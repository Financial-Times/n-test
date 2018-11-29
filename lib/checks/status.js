module.exports = (testPage) => {
	if (testPage.check.status === 204) {
		//eslint-disable-next-line no-console
		console.info('204 status checks are not supported yet!');
		return { expected: 204, actual: '¯\_(ツ)_/¯ ', result: true };
	} else if (typeof testPage.check.status === 'string') {
		return {
			expected: `redirect to ${testPage.check.status}`,
			actual: testPage.redirect ? `redirect to ${testPage.redirect.to}` : `did not redirect: ${testPage.status}`,
			result: testPage.redirect && testPage.check.status === testPage.redirect.to
		};
	} else {
		return { expected: testPage.check.status, actual: testPage.status, result: testPage.status === testPage.check.status || testPage.status === 304 && testPage.check.status === 200 };
	}
};
