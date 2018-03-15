module.exports = async (page, url, tokens) => {
	await page.setCookie({
		name: 'FTSession',
		value: tokens.FTSession,
		domain: '.ft.com',
		expires: new Date().getTime() / 1000 + 137
	});

	await page.setCookie({
		name: 'FTSession_s',
		value: tokens.FTSession_s,
		domain: '.ft.com',
		expires: new Date().getTime() / 1000 + 137,
		secure: true
	});
};
