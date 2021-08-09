const assert = require('assert');

module.exports = [{
	urls: {
		'/status/503': 200,
		'/status/200': 500,
		'/status/404': {
			status: 404
		},
		'/status/html/500': {
			description: 'Output should show HTML response body when unexpected status code',
			status: 200,
		},
		'/coverage/bad': {
			cssCoverage: {
				'coverage/bad': 50
			}
		},
		'/coverage/okay': {
			cssCoverage: {
				'coverage/okay': 60
			}
		},
		'/jank': {
			elementShifts: {
				'.content': {
					maxCount: 0
				}
			}
		},
		'/json': {
			content: (body) => {
				assert.strictEqual(body.key, 'wrong-value');
			}
		}
	}
}

];
