


module.exports = async (testPage) => {
	const results = [];

	let changeHistory = await testPage.page.evaluate((elementShifts) => {
		const POLL_INTERVAL = 300;
		const MAX_TRIES = 10;
		const positionHistory = {};

		const checkElements = () => {
			Object.keys(elementShifts).forEach(selector => {
				const el = document.querySelector(selector);
				const current = el.getBoundingClientRect().top;
				const history = positionHistory[selector];
				if(!history) {
					positionHistory[selector] = {
						previous: current,
						changes: 0,
						pixelsMoved: 0
					};
					return;
				}

				const previous = history.previous;
				const diff = Math.abs(current - previous);

				if(diff > 0) {
					history.changes++;
					history.pixelsMoved += diff;
				}

				history.previous = current;
			});
		};

		return new Promise((resolve) => {
			let tries = 0;
			const interval = setInterval(() => {
				if(tries++ < MAX_TRIES) {
					checkElements();
				} else {
					clearInterval(interval);
					resolve(positionHistory);
				}
			}, POLL_INTERVAL);
		});

	}, testPage.check.elementShifts);

	Object.entries(changeHistory).forEach(([selector, history]) => {
		const config = testPage.check.elementShifts[selector];
		if(config.hasOwnProperty('maxCount')) {
			results.push({
				expected: `${selector} not to move more than ${config.maxCount} times`,
				actual: `moved ${history.changes} times within the first few seconds`,
				result: history.changes <= config.maxCount
			});
		}

		if(config.hasOwnProperty('maxPixels')) {
			results.push({
				expected: `${selector} not to move by more than ${config.maxPixels}px`,
				actual: `moved a total of ${history.pixelsMoved}px within the first few seconds`,
				result: history.pixelsMoved <= config.maxPixels
			});
		}
	});

	return results;
};
