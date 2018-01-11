#!/usr/bin/env node


let program = require('commander');

program.version(require('../package.json').version);


require('../tasks/smoke')(program);


// Handle unknown commands
program
	.command('*')
	.description('')
	.action(function (app) {
		utils.exit(`The command ${app} is not known`);
	});


program.parse(process.argv);

if (!process.argv.slice(2).length) {
	program.outputHelp();
}
