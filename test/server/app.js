const express = require('express');

const app = express();

app.get('/status/:status', (req, res) => {
	res.status(req.params.status).send(req.params.status);
});

app.get('/coverage/good', (req, res) => {
	res.send(`
		<body>
			<style>
				.one { background: red; }
				.two { background: red; }
				.three { background: red; }
			</style>
			<div class="one"></div>
			<div class="two"></div>
			<div class="three"></div>
		</body>
	`);
});

app.get('/coverage/okay', (req, res) => {
	res.send(`
		<body>
			<style>
				.one { background: red; }
				.two { background: red; }
				.three { background: red; }
			</style>
			<div class="one"></div>
			<div class="two"></div>
		</body>
	`);
});

app.get('/coverage/bad', (req, res) => {
	res.send(`
		<body>
			<style>
				.one { background: red; }
				.two { background: red; }
				.three { background: red; }
			</style>
			<div class="one"></div>
		</body>
	`);
});

app.get('/redirect', (req, res) => {
	res.redirect('/status/200');
});

app.post('/post', (req, res) => {
	let body = '';
	req.on('data', (chunk) => {
		body += chunk.toString();
	});
	req.on('end', () => {
;		res.send('GOT: ' + body);
	});
});

if (!module.parent) {
	app.listen(process.env.PORT || 3004);
} else {
	module.exports = app;
}
