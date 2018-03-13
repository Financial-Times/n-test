module.exports = [
	{
		user: 'premium',
		urls: {
			'/session/1': 200
		}
	},
	{
		urls: {
			'/session/2': 403
		}
	},
	{
		user: 'standard',
		urls: {
			'/session/3': 200
		}
	},
	{
		user: 'expired',
		urls: {
			'/session/4': 200
		}
	}
];
