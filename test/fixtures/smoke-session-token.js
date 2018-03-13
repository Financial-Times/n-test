module.exports = [{
	urls: {
		'/session/1': {
			user: 'standard',
			status: 200
		},
		'/session/2': {
			status: 403
		},
		'/session/3': {
			user: 'premium',
			status: 200
		},
		'/session/4': {
			user: 'expired',
			status: 200
		}
	}
}];
