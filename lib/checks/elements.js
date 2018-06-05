module.exports = async (testPage) => {
	const results = [];
	//eslint randomly started failing this, even though it is guarded!
	//eslint-disable-next-line guard-for-in
	for(const selector in testPage.check.elements) {
			if(testPage.check.elements.hasOwnProperty(selector)) {
			const assertion = testPage.check.elements[selector];
			//If we're expecting an element, wait for it.
			if(!!assertion > 0 && testPage.page && testPage.page.waitForSelector) {
				await testPage.page.waitForSelector(selector);
			}

			if(typeof assertion === 'number') {
				const count = await testPage.getVisibleElements(selector);
				results.push({
					expected: `should have ${assertion} visible elements matching selector ${selector}`,
					actual: count,
					result: count === assertion
				});

			} else if (typeof assertion === 'boolean') {
				const count = await testPage.getVisibleElements(selector);
				results.push({
					expected: `should ${assertion ? 'have ' : 'not have '} visible elements matching selector ${selector}`,
					actual: count,
					result: !!count === assertion
				});
			} else if (typeof assertion === 'string') {

					const elText = await testPage.getElementText(selector);
					results.push({
						expected: `element with selector selector ${selector} should contain text ${assertion}`,
						actual: elText,
						result: elText.includes(assertion)
					});
			}
		};

	}
	return results;
};
