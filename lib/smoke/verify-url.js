/* eslint-disable no-console */
const pc = require('picocolors');
const { URL } = require('url');

const { NTestError } = require('../errors');

const verifyUrl = (testPage, browser, tests) => async () => {

	let results = {
		url: testPage.url,
		testsRun: 0,
		passed: 0,
		failed: 0,
		errors: 0,
		tests: {}
	};

	try {

		//open the page
		await testPage.init(browser);

		const checks = Object.entries(tests).map(([name, testFn]) => {
			const expectation = testPage.check[name];
			return (typeof expectation === 'undefined' ? Promise.resolve() : Promise.resolve(testFn(testPage)).then(result => ({ name, results: [].concat(result) })));
		});

		const checkResults = await Promise.all(checks);
		//check for user option, use real url for logging
		let realUrl = {};
		if (testPage.requestHeaders['FT-Test-Host']) {
			realUrl = new URL(`
				${testPage.https ? 'https://' : 'http://'}
				${testPage.requestHeaders['FT-Test-Host']}
				${testPage.url.pathname || ''}
			`);
		}
		const description = testPage.description? `\n\t${pc.bold('Description:')} ${testPage.description}` : '';
		console.log(`${pc.bold('Testing URL')} (${pc.blue(testPage.type)}): ${pc.underline(pc.yellow(realUrl.href || testPage.url.toString()))} ${description}`);
		checkResults
			.filter(result => !!result)
			.forEach((check) => {

				results.testsRun++;
				check.results.forEach(assertion => {
					if(assertion.result === true) {
						results.passed++;
						console.log(pc`   ✅  {bgGreen  OK } ${check.name}`);
						console.log(pc`   {dim Expected:} ${assertion.expected},`, pc`{dim got:} ${assertion.actual}`);
					} else {
						results.failed++;
						console.log(pc`   ❌  {bgRed  ERROR } ${check.name}`);
						console.log(pc`   {dim Expected:} ${assertion.expected},`, pc`{dim got:} ${assertion.actual}`);
					}
				});
			});

	} catch(err) {

		// We want n-test to stop running if we've thrown an NTestError
		if (err instanceof NTestError) {
			throw err;
		}

		//Sometimes selenium times out. if so - ignore.
		console.warn(err);
		results.errors++;
	} finally {
		await testPage.close();
	}

	return results;
};

module.exports = verifyUrl;
