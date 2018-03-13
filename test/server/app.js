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
			<div class="one">1</div>
			<div class="two">2</div>
			<div class="three">3</div>
			<div class="no-content"></div>
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
			<div class="one">1</div>
			<div class="two">2</div>
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
			<div class="one">1</div>
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

app.get('/json', (req, res) => {
	res.json({ key: 'value' });
});

app.get('/network-requests', (req, res) => {
	res.send(`
		<body>
			<img src="/status/200" />
			<img src="/status/302" />
		</body>
	`);
});

app.get('/session/*', require('cookie-parser')(), (req, res) => {
	const sessionId = req.cookies['FTSession'] && req.cookies['FTSession_s'];
	let status;
	if (sessionId) {
		status = 200;
	} else {
		status = 403;
	}
	res.status(status).send(`${status}`);
});

if (!module.parent) {
	app.listen(process.env.PORT || 3004);
} else {
	module.exports = app;
}
