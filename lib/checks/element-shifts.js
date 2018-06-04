
module.exports = async (testPage) => {
	const results = [];

	let changeHistory = await testPage.page.evaluate((elementShifts) => {
		const positionHistory = {};
		const POLL_INTERVAL = 500;
		const MAX_TRIES = 6;

		const checkElements = () => {
			Object.keys(elementShifts).forEach(selector => {
				const el = document.querySelector(selector);
				const current = el.offsetTop;
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
		}

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
		const threshold = testPage.check.elementShifts[selector];
		results.push({
			expected: `${selector} not to move more than ${threshold} times`,
			actual: `moved ${history.changes} times, a total of ${history.pixelsMoved}px`,
			result: history.changes <= threshold
		});
	});

	return results;
};