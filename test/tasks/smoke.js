const server = require('../server/app');
const expect = require('chai').expect;
const smoke = require('../../lib/smoke');

describe('Smoke Tests of the Smoke', () => {

	before(() => {
		//Start the server
		server.listen(3004);
	});


	it('tests should pass if all the urls return the correct status', async () => {

		return smoke.run({
			host: 'http://localhost:3004',
			config: 'test/fixtures/smoke-status-pass.json'
		});
	});

	it('tests should fail if some urls return the incorrect status code', async () => {

		smoke.run({
			host: 'http://localhost:3004',
			config: 'test/fixtures/smoke-status-pass.json',
		})
		.catch(results => {
			expect(results.total).to.equal(2);
			expect(results.failures).to.equal(1);
		});

	});
});
