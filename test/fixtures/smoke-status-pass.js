module.exports = [{
		urls: {
			'/status/200': 200,
			'/status/204': 204, // this will be skipped because we don't support it yet!
			'/status/404': {
				status: 404,
				content: '404'
			},
			'/status/302': 302,
			'/redirect': '/status/200',
			'/post': {
				method: 'POST',
				body: 'stuff',
				status: 200,
				content: (content) => {
					return content.includes('stuff');
				}
			},
			'/json' : {
				content: (content) => JSON.parse(content).key === 'value'
			},
			'/network-requests': {
				networkRequests: {
					'/status/200': 1,
					'/status': 2,
					'/json': 0
				}
			}

		}
	}
];
