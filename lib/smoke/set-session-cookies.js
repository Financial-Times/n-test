module.exports = async (page, url, tokens) => {
	await page.setCookie({
		name: 'FTSession',
		value: tokens.FTSession,
		url
	});

	await page.setCookie({
		name: 'FTSession_s',
		value: tokens.FTSession_s,
		url
	});
};
