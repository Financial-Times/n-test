/* eslint-disable no-console */
const chalk = require('chalk');

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

	try {
		const checks = Object.entries(tests).map(([name, testFn]) => {
			const expectation = testPage.check[name];
			return (typeof expectation === 'undefined' ? Promise.resolve() : Promise.resolve(testFn(testPage)).then(result => ({ name, results: [].concat(result) })));
		});


		const checkResults = await Promise.all(checks);
		console.log(chalk`{bold Testing URL }({blue ${testPage.type}}): {underline.yellow ${testPage.url}}`);
		checkResults
			.filter(result => !!result)
			.forEach((check) => {

				results.testsRun++;
				check.results.forEach(assertion => {
					if(assertion.result === true) {
						results.passed++;
						console.log(chalk`   ✅  {bgGreen  OK } ${check.name}`);
						console.log(chalk`   {dim Expected:} ${assertion.expected},`, chalk`{dim got:} ${assertion.actual}`);
					} else {
						results.failed++;
						console.log(chalk`   ❌  {bgRed  ERROR } ${check.name}`);
						console.log(chalk`   {dim Expected:} ${assertion.expected},`, chalk`{dim got:} ${assertion.actual}`);
					}
				});
			});

	} catch(err) {
		//Sometimes selenium times out. if so - ignore.
		if(err.message === 'ESOCKETTIMEDOUT') {
			console.warn(err);
		} else {
			throw err;
		}
	} finally {
		await testPage.close();
	}

	return results;
};

module.exports = verifyUrl;
