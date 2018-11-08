module.exports = async (testPage) => {
	const path = testPage.check.screenshot.path;
	const fileName = `${testPage.type}__${testPage.name}__${testPage.url.pathname.replace(/\//g, '-')}.png`;
	const screenshot = await testPage.screenshot(`${path}/${fileName}`);

	return {
		expected: `Taken screenshot of ${fileName}`,
		actual: !!screenshot,
		result: true
	};
};
