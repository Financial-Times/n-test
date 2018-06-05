module.exports = [{
		urls: {
			'/status/200': 200,
			'/status/204': 204, // this will be skipped because we don't support it yet!
			'/status/304': 200, // browsers will sometimes 304, so let's pretend like that is okay
			'/status/404': {
				status: 404,
				content: '404',
				responseHeaders: {
					'X-Powered-By': 'Express'
				}
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
				waitUntil: 'load',
				networkRequests: {
					'/status/200': 1,
					'/status': 2,
					'/status/2': true,
					'/json': false
				}
			},
			'/coverage/good': {
				waitUntil: 'load',
				elements: {
					'.one': 1,
					'.two': 1,
					'div': 3,
					'.does-not-exist': 0,
					'.no-content': false
				},
				cssCoverage: {
					'coverage/good': 50
				}
			},
			'/coverage/okay': {
				waitUntil: 'load',
				elements: {
					'.one': true,
					'.three': 0
				},
				cssCoverage: {
					'coverage/okay': 50
				}
			},
			'/no-jank': {
				elementShifts: {
					'.content': {
						maxCount: 0,
						maxPixels: 0
					}
				}
			}
	}
}];
