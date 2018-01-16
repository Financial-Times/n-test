/*globals beforeAll, expect */

const server = require('../server/app');
const smoke = require('../../lib/smoke');

describe('Smoke Tests of the Smoke', () => {

	beforeAll(() => {
		//Start the server
		server.listen(3004);
	});

	describe('status checks', () => {
		test('tests should pass if all the urls return the correct status', async () => {

			return smoke.run({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-status-pass.js'
			})
			.then(({results}) => {
				expect(results.numPassedTests).toEqual(2);
				expect(results.numFailedTests).toEqual(0);

			});
		});

		test('tests should fail if some urls return the incorrect status code', async () => {

			return smoke.run({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-status-fail.js',
			})
			.then(({results}) => {
				expect(results.numPassedTests).toEqual(1);
				expect(results.numFailedTests).toEqual(1);
			});
		});
	});


	// describe('Initial status code', () => {
	// 	test('Initial status should return the status of the first request in the chain', () => {
	// 		return smoke.run({
	// 			host: 'http://localhost:3004',
	// 			config: 'test/fixtures/smoke-status-redirect.js',
	// 		})
	// 		.then(({results}) => {
	// 			expect(results.numPassedTests).toEqual(2);
	// 		});
	// 	});
	// });

	describe('CSS coverage', () => {
		test('tests should pass if CSS is well covered', async () => {

			return smoke.run({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-coverage-pass.js'
			})
			.then(({results}) => {
				expect(results.numPassedTests).toEqual(2);
				expect(results.numFailedTests).toEqual(0);

			});
		});

		test('tests should fail if CSS coverage is below threshold', async () => {

			return smoke.run({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-coverage-fail.js',
			})
			.then(({results}) => {
				expect(results.numPassedTests).toEqual(0);
				expect(results.numFailedTests).toEqual(2);
			});
		});
	});

});
