module.exports = async (testPage) => {
	const path = testPage.check.screenshot.path;
	const fileName = `${testPage.type}-${testPage.url.pathname.replace(/\//g, '_')}.png`;
	const screenshot = await testPage.screenshot(`${path}/${fileName}`);

	return {
		expected: `Taken screenshot of ${fileName}`,
		actual: !!screenshot,
		result: true
	};
};
