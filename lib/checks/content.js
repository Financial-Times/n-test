module.exports = async (testPage) => {
	const headers = testPage.response.headers();
	const isHTML = headers['content-Type'] && headers['content-Type'].includes('text/html');

	const content = isHTML ? await testPage.page.content() : await testPage.response.text();

	let validation;
	if(typeof testPage.check.content === 'function') {
		try {
			validation = testPage.check.content(content);
		} catch(err) {
			console.error(err); //eslint-disable-line no-console
			// This will likely be an assertion error, so mark the test as failed
			validation = false;
		}
	} else {
		validation = (content).includes(testPage.check.content);
	}

	return {
		expected: 'Response content should validate against provided function',
		actual: validation,
		result: !!validation
	};
};
