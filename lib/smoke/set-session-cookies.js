module.exports = async (page, tokens) => {
	await page.setCookie({
		name: 'FTSession',
		value: tokens.FTSession,
		domain: 'localhost'
	});

	await page.setCookie({
		name: 'FTSession_s',
		value: tokens.FTSession_s,
		domain: 'localhost'
	});
};
