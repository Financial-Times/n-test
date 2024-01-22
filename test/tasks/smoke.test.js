/*globals beforeAll, expect */

const app = require('../server/app');
const SmokeTest = require('../../lib/smoke/smoke-test');
const { NTestConfigError } = require('../../lib/errors');
const { spawn } = require('child_process');

describe('Smoke Tests of the Smoke', () => {

	let server

	beforeAll(() => {
		//Start the server
		server = app.listen(3004);

		process.env.TEST_SESSIONS_URL =
			'https://fuhn0pye67.execute-api.eu-west-1.amazonaws.com/prod'
		process.env.TEST_SESSIONS_API_KEY = 'mock-api-key'
	});

	afterAll(() => {
		server.close();
	})

	describe('Status checks', () => {

		test('tests should pass if all the urls return the correct status', (done) => {
			const smoke = new SmokeTest({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-pass.js'
			});
			smoke.run()
				.then((results) => {
					expect(results.passed.length).toEqual(12);
					expect(results.failed.length).toEqual(0);
					expect(results.errors.length).toEqual(0);
					done();
				});
		}, 10000);

		test('tests should fail if some tests fail', (done) => {

			const smoke = new SmokeTest({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-fail.js'
			});
			smoke.run()
				.catch((results) => {
					expect(results.passed.length).toEqual(1);
					expect(results.failed.length).toEqual(7);
					expect(results.errors.length).toEqual(0);
					done();
				});
		}, 10000);

	});

	describe('Tests that error', () => {

		test('should fail if any tests error', (done) => {
			const smoke = new SmokeTest({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-error-fail.js'
			});

			smoke.run()
				.catch((results) => {
					expect(results.errors.length).toEqual(3);
					expect(results.failed.length).toEqual(0);
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
			smoke.run()
				.then((results) => {
					expect(results.passed.length).toEqual(1);
					expect(results.failed.length).toEqual(0);
					done();
				});
		});

	});

	//TODO: figure out how to test the www.ft.com bit!
	describe('Session tokens', () => {

		test('should not run user-based tests on localhost', () => {

			const smoke = new SmokeTest({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-session-token.js'
			});
			smoke.run()
				.then((results) => {
					expect(results.urlsTested).toEqual(1);
					expect(results.passed.length).toEqual(1);
				});
		});

	});

	describe('CLI task', () => {

		test('should exit with the correct code for a passing test', (done) => {
			const proc = spawn('./bin/n-test.js', ['smoke', '--host', 'http://localhost:3004', '--config', 'test/fixtures/smoke-pass.js']);
			proc.on('close', (code) => {
				expect(code).toEqual(0);
				done();
			});
		}, 10000);

		test('should exit with a bad code if the test fails', (done) => {
			const proc = spawn('./bin/n-test.js', ['smoke', '--host', 'http://localhost:3004', '--config', 'test/fixtures/smoke-fail.js']);
			proc.on('close', (code) => {
				expect(code).toEqual(1);
				done();
			});
		}, 10000);

	});

	describe('Config validation', () => {

		test('tests should run and pass when all headers in a config are valid', (done) => {

			const smoke = new SmokeTest({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-valid-headers.js'
			});

			smoke.run().then((results) => {
				expect(results.passed.length).toEqual(1);
				expect(results.failed.length).toEqual(0);
				done();
			});

		}, 10000);

		test('should throw an NTestConfigError when config contains an invalid header', async () => {

			const smoke = new SmokeTest({
				host: 'http://localhost:3004',
				config: 'test/fixtures/smoke-invalid-header.js'
			});

			await expect(smoke.run()).rejects.toThrowError(NTestConfigError);

		}, 10000);

		// TODO: Add test for a null header once functionality to pass config
		// object has been added i.e. config for these validation tests can be
		// multiple exports in one config file

	});

});
