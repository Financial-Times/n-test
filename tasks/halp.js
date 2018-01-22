const chalk = require('chalk');

const messages = [
	chalk`It\'s time to put the {bold FUN} back in function`,
	chalk`'You can do this. Just {italic breath} ☺️`,
	'GO GET EM TIGER 🐯A',
	'It\'s not the number of lines of code we write, but the lines of code that take our breath away.',
	'Life is not about the software we write, but the friends we make along the way',
	'You\'re only as strong as the o-colors you mix, the o-tables you dance on and the o-friends you party with.',
	'Code, laugh, love',
	'Sing like no one is listening. Love like you\'ve never been hurt. Develop like nobody is debugging.',
	'Every great developer you know got there by solving problems they were unqualified to solve until they actually did it.',
	'"That brain of mine is something more than merely mortal, as time will show." - Ada Lovelace',
	'"Testing leads to failure, and failure leads to understanding." - Burt Rutan',
	'"Sometimes it\'s better to leave something alone, to pause, and that\'s very true of programming." - Joyce Wheeler',
	'"Codes are a puzzle. A game, just like any other game." - Alan Turing',
	'Write every function like it\'s your last.',
	'You miss 100% of the bugs you don\'t make',
	'Don\'t forget to debug yourself first',
	'Believe there is good in your code.',
	'Take a walk. Make some tea. Go talk to some of your awesome colleagues (but not in the kitchen).',
	'Keep calm and curry on. (don\'t worry - nobody really knows what currying is)',
	'Be the change request you want to see in the world.',
	'Forget the module. What do YOU require?',
	'Once upon a time, some idiot put display: none on the FT.com homepage on budget day. They survived. So can you.',
	'If Slack can use 110% of CPU time, then so can you!',
	'Think outside the box model.',
	'If ever you feel like you\'re losing control, remember that there is a variant of you that\'s itching to take it.',
	'git reset --HARD life',
	'rm -rf all_of_your_problems',
	'Polyfill your day with positivity!',
	'In the end it\'s all just 1s and 0s.'

];

const characters = [
	chalk`{bgRed \n (* ^ ω ^)\n}`,
	chalk`{bgGreen \n٩(◕‿◕｡)۶\n}`,
	chalk`{bgBlue \n(⌒ω⌒)\n}`,
	chalk`{bgYellow \n(*^‿^*)\n}`,
	chalk`{bgCyan \n(*¯︶¯*)\n}`,
	chalk`{bgWhite.cyan \n٩(◕‿◕)۶\n}`,
	chalk`{magenta \n(✯◡✯)\n}`,
	chalk`{blue \n(ﾉ◕ヮ◕)ﾉ*:･\n}`
];


const halp = () => {
	const character = characters[Math.floor(Math.random()*characters.length)];
	const message = messages[Math.floor(Math.random()*messages.length)];
	// eslint-disable-next-line no-console
	console.log(character);
	// eslint-disable-next-line no-console
	console.log(message);
};

module.exports = halp;
