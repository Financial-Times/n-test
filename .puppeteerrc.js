const { join } = require('path');

const basePath = join(__dirname, 'node_modules', 'puppeteer', '.cache');
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
	// Changes the cache location for Puppeteer.
	cacheDirectory: basePath,
	downloadPath: basePath,
};
