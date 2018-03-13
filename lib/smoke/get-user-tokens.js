const fetch = require('node-fetch');

module.exports = (userType) => {
	let url = `${process.env.TEST_SESSIONS_URL}/${userType}?api_key=${process.env.TEST_SESSIONS_API_KEY}`;
	return fetch(url)
		.then((response) => {
			if (response.ok) {
				return response.json();
			} else {
				throw new Error('Couldn\'t fetch the test session token. Please check TEST_SESSIONS_URL and TEST_SESSIONS_API_KEY environment variables.');
			}
		});
};
