module.exports = [{
		urls: {
			'/status/200?1': { status: 200, https: true }, //These two will fail because the test server doesn't support https
			'/status/200?2': { status: 200, https: true },
			'/status/200?3': { status: 200, https: false },
			'/status/200?4': { status: 200, https: false },
		}
	}
];
