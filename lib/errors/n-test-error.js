class NTestError extends Error {

	constructor (...params) {
		super(...params);

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		// TODO: Check that this is still required
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, NTestError);
		}
	}

}

module.exports = NTestError;
