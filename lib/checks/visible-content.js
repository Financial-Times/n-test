// Checks how much of the viewport is content
// Inputs: contentSelectors (array)
// Input: Threshold

const promisify = require('util').promisify;
const getPixels = promisify(require('get-pixels'));

const DELTA = 1;

const percentageRed = (pixels) => {
	//pixels is an array of [r, g, b, a, r, g, b, a....]
	let total = 0;
	let totalRed = 0;
	for(let i = 0; i < pixels.length; i+=4) {
		total++;
		const red = pixels[i];
		const green = pixels[i+1];
		const blue = pixels [i+2];
		if( red >= (255 - DELTA) && green <= DELTA && blue <= DELTA) {
			totalRed++;
		}
	}

	return (totalRed / total) * 100;
};

module.exports = async (testPage) => {
	const contentSelector = testPage.check.visibleContent.contentSelector;
	const CONTENT_COLOR = '#ff0000';

	//Make all the content red. Stop transitions in case anything transitions BG, and make images (and child images) transparent
	testPage.page.addStyleTag({
		content: `
			${contentSelector} {
				color: ${CONTENT_COLOR}!important;
				background: ${CONTENT_COLOR}!important;
				transition: none!important;
			}
			${contentSelector.replace(/\./g, 'img.')} {
				filter: opacity(0)!important;
			},
			${contentSelector.replace(/\./g, 'img .')} {
				filter: opacity(0)!important;
			}
		`
	});

	// Take a screenshot of the viewport
	const screenshot = await testPage.page.screenshot({ path: 'tmp/diff.png'});

	const pixels = await getPixels(screenshot, 'image/png');

	const redAmount = parseFloat(percentageRed(pixels.data)).toFixed(2);

	return {
		expected: `At least ${testPage.check.visibleContent.threshold}% of the viewport should be actual content`,
		actual: `${redAmount}% of the viewport is content`,
		result: redAmount >= testPage.check.visibleContent.threshold
	};
};
