const NTestError = require('./n-test-error');

class NTestConfigError extends NTestError {

	constructor (...params) {
		super(...params);

		this.name = this.constructor.name;

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, NTestConfigError);
		}
	}

}

module.exports = NTestConfigError;
