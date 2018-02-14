/*globals beforeAll, expect */

const server = require('../server/app');
const SmokeTest = require('../../lib/smoke');

describe('Smoke Tests of the Smoke', () => {

	beforeAll(() => {
		//Start the server
		server.listen(3004);
	});

	describe('status checks', () => {
		test('tests should pass if all the urls return the correct status', (done) => {
			const smoke = new SmokeTest({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-status-pass.js'
			});
			return smoke.run()
			.then((results) => {
				expect(results.passed.length).toEqual(7);
				expect(results.failed.length).toEqual(0);
				done();
			});
		});

		test('tests should fail if some urls return the incorrect status code', (done) => {

			const smoke = new SmokeTest({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-status-fail.js'
			});
			return smoke.run()
			.catch((results) => {
				expect(results.passed.length).toEqual(1);
				expect(results.failed.length).toEqual(1);
				done();
			});
		});
	});

	describe('CSS coverage', () => {
		test('tests should pass if CSS is well covered',(done) => {

			const smoke = new SmokeTest({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-coverage-pass.js'
			});
			return smoke.run()
			.then((results) => {
				expect(results.passed.length).toEqual(2);
				expect(results.failed.length).toEqual(0);
				done();

			});
		});

		test('tests should fail if CSS coverage is below threshold', (done) => {

			const smoke = new SmokeTest({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-coverage-fail.js'
			});
			return smoke.run()
			.catch((results) => {
				expect(results.passed.length).toEqual(0);
				expect(results.failed.length).toEqual(2);
				done();
			});
		});
	});

	describe('Adding custom checks', () => {
		test('should allow adding custom assertions',(done) => {

			const smoke = new SmokeTest({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-custom-check.js'
			});

			smoke.addCheck('custom', async (testPage) => {
				const metrics = await testPage.page.metrics();

				return {
					expected: `no more than ${testPage.check.custom} DOM nodes`,
					actual: `${metrics.Nodes} nodes`,
					result: testPage.check.custom >= metrics.Nodes
				};
			});
			return smoke.run()
			.then((results) => {
				expect(results.passed.length).toEqual(1);
				expect(results.failed.length).toEqual(0);
				done();
			});
		});
	});
});
