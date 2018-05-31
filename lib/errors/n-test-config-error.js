const NTestError = require('./n-test-error');

class NTestConfigError extends NTestError {

	constructor (...params) {
		super(...params);

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		// TODO: Check that this is still required
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, NTestConfigError);
		}
	}

}

module.exports = NTestConfigError;
