/*globals beforeAll, expect */

const server = require('../server/app');
const smoke = require('../../lib/smoke');

describe('Smoke Tests of the Smoke', () => {

	beforeAll(() => {
		//Start the server
		server.listen(3004);
	});

	describe('status checks', () => {
		test('tests should pass if all the urls return the correct status', (done) => {

			return smoke.run({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-status-pass.js'
			})
			.then((results) => {
				expect(results.passed.length).toEqual(6);
				expect(results.failed.length).toEqual(0);
				done();
			});
		});

		test('tests should fail if some urls return the incorrect status code', (done) => {

			return smoke.run({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-status-fail.js',
			})
			.catch((results) => {
				expect(results.passed.length).toEqual(1);
				expect(results.failed.length).toEqual(1);
				done();
			});
		});
	});

	describe('CSS coverage', () => {
		test('tests should pass if CSS is well covered',(done) => {

			return smoke.run({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-coverage-pass.js'
			})
			.then((results) => {
				expect(results.passed.length).toEqual(2);
				expect(results.failed.length).toEqual(0);
				done();

			});
		});

		test('tests should fail if CSS coverage is below threshold', (done) => {

			smoke.run({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-coverage-fail.js',
			})
			.catch((results) => {
				expect(results.passed.length).toEqual(0);
				expect(results.failed.length).toEqual(2);
				done();
			});
		});
	});

});
