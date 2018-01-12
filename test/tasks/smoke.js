/*globals beforeAll */

const server = require('../server/app');
const expect = require('chai').expect;
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
				config: 'test/fixtures/smoke-status-pass.json'
			})
			.then(({results}) => {
				expect(results.numPassedTests).to.equal(2);
				expect(results.numFailedTests).to.equal(0);

			});
		});

		test('tests should fail if some urls return the incorrect status code', async () => {

			return smoke.run({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-status-fail.json',
			})
			.then(({results}) => {
				expect(results.numPassedTests).to.equal(1);
				expect(results.numFailedTests).to.equal(1);
			});
		});
	});



	describe('CSS coverage', () => {
		test('tests should pass if CSS is well covered', async () => {

			return smoke.run({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-coverage-pass.json'
			})
			.then(({results}) => {
				expect(results.numPassedTests).to.equal(2);
				expect(results.numFailedTests).to.equal(0);

			});
		});

		test('tests should fail if CSS coverage is below threshold', async () => {

			return smoke.run({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-coverage-fail.json',
			})
			.then(({results}) => {
				expect(results.numPassedTests).to.equal(0);
				expect(results.numFailedTests).to.equal(2);
			});
		});
	});

});
