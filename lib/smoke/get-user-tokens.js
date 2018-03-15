const testSessionsClient = require('@financial-times/n-test-sessions-client');

module.exports = (userType) => {
	return testSessionsClient[userType]();
};
