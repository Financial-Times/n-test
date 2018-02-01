const inquirer = require('inquirer');

const askForSets = async (config) => {
	const possibilities = config.map((test, index)=> test.name || 'Untitled ' + index);
	const responses = await inquirer.prompt({
		name: 'choices',
		type: 'checkbox',
		message: 'Select the URL sets to test',
		choices: possibilities
	});
	return [].concat(responses.choices);
};

module.exports = async (configFile, sets, interactive) => {
	const config = require(configFile);
	let configsToOpen;

	if(interactive && !(sets && sets.length)) {
		sets = await askForSets(config);
	}

	if(sets && sets.length) {
		configsToOpen = config.filter((test, index) => (sets.includes(test.name) || sets.includes('Untitled ' + index)));
	} else {
		configsToOpen = config;
	}

	return configsToOpen;
};
