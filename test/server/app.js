const express = require('express');

const app = express();

app.get('/status/:status', (req, res) => {
	res.status(req.params.status).send(req.params.status);
});

app.get('/status/html/:status', (req, res) => {
	res
		.status(req.params.status)
		.set('Content-Type', 'text/html')
		.send(`
			<!DOCTYPE html>
			<html lang="en">
				<head>
				<meta charset="utf-8">
				<title>Status ${req.params.status}</title>
				</head>
				<body>
					<h1>Status is ${req.params.status}</h1>
				</body>
			</html>
		`);
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

app.get('/jank', (req, res) => {
	res.send(`
		<body>
			<style>
				.header {
					height: 200px;
				}
				.content {
					height: 100px;
				}
			</style>
			<div class="ad"></div>
			<div class="header">Header</div>
			<div class="content">Content</div>
			<script async defer>
				setTimeout(() => {
					document.querySelector('.ad').style.height = '300px';
				}, 1000);
			</script>
		</body>
	`);
});

app.get('/no-jank', (req, res) => {
	res.send(`
		<body>
			<style>
				.ad {
					min-height: 300px;
				}
				.header {
					height: 200px;
				}
				.content {
					height: 100px;
				}
			</style>
			<div class="ad"></div>
			<div class="header">Header</div>
			<div class="content">Content</div>
			<script async defer>
				setTimeout(() => {
					document.querySelector('.ad').style.height = '300px';
				}, 1000);
			</script>
		</body>
	`);
});

if (!module.parent) {
	app.listen(process.env.PORT || 3004);
} else {
	module.exports = app;
}
