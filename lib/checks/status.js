const outputErrorInfo = async (testPage) => {
	const headers = testPage.response.headers();
	const isHTML = headers['content-Type'] && headers['content-Type'].includes('text/html');
	const content = isHTML ? await testPage.page.content() : await testPage.response.text();
	return `Status = ${testPage.status}. Response body content :

	${content}

	~ENDS~
	`;
};

module.exports = async (testPage) => {
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
		const isUnexpectedHttpError = testPage.check.status !== 500 && testPage.status === 500;
		return {
			expected: `Status = ${testPage.check.status}`,
			actual: isUnexpectedHttpError ? await outputErrorInfo(testPage) : `Status = ${testPage.status}`,
			result: testPage.status === testPage.check.status || testPage.status === 304 && testPage.check.status === 200
		};
	}
};
