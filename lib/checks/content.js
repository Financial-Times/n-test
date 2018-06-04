module.exports = async (testPage) => {
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
};