#!/usr/bin/env node


let program = require('commander');

const halp = require('../tasks/halp');

program.version(require('../package.json').version);


require('../tasks/smoke')(program);
require('../tasks/open')(program);
require('../tasks/screenshot')(program);


// Handle unknown commands
program
	.command('*')
	.description('')
	.action(function (app) {

		if(app && app.toUpperCase().startsWith('HALP')) {
			halp();
		} else {
			// eslint-disable-next-line no-console
			console.error(`The command ${app} is not known`);
			process.exit(1);
		}
	});


program.parse(process.argv);

if (!process.argv.slice(2).length) {
	program.outputHelp();
}
