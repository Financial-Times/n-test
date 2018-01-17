module.exports = [{
		urls: {
			'/status/200': 200,
			'/status/204': 204, // this will be skipped because we don't support it yet!
			'/status/404': {
				status: 404
			},
			'/status/302': 302,
			'/redirect': '/status/200'

		}
	}
];
