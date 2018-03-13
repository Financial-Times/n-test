/* eslint-disable no-console */
const verifyUrl = (testPage, browser, tests) => async () => {
	//open the page
	await testPage.init(browser);

	let results = {
		url: testPage.url,
		testsRun: 0,
		passed: 0,
		failed: 0,
		tests: {}
	};

	const checks = Object.entries(tests).map(([name, testFn]) => {
		const expectation = testPage.check[name];
		return (typeof expectation === 'undefined' ? Promise.resolve() : Promise.resolve(testFn(testPage)).then(result => ({ name, results: [].concat(result) })));
	});


	const checkResults = await Promise.all(checks);
	console.log(`Testing URL: ${testPage.url}`);
	checkResults
		.filter(result => !!result)
		.forEach((check) => {

			results.testsRun++;
			check.results.forEach(assertion => {
				if(assertion.result === true) {
					results.passed++;
					console.log(`   ✅  OK  ${check.name} - `, `Expected: ${assertion.expected},`, `got: ${assertion.actual}`);
				} else {
					results.failed++;
					console.log(`   ❌  ERROR  ${check.name} - `,`Expected: ${assertion.expected},`, `got: ${assertion.actual}`);
				}
			});
		});

	await testPage.page.close();

	return results;
};

module.exports = verifyUrl;
