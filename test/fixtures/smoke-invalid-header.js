module.exports = [
	{
		// All valid headers
		headers: {
			'ft-valid-header-number': 1,
			'ft-valid-header-string': 'some-string',
		},
		urls: {
			'/status?1': 200
		}
	},
	{
		// Contains an invalid header (undefined)
		headers: {
			'ft-valid-header-number': 1,
			'ft-valid-header-string': 'some-string',
			'ft-invalid-header-undefined': process.env.UNDEFINED_HEADER_VARIABLE,
		},
		urls: {
			'/status?2': 200
		}
	},
];
