const express = require('express');

const app = express();

app.get('/status/:status', (req, res) => {
	res.status(req.params.status).send();
});

if (!module.parent) {
	app.listen(process.env.PORT || 3004);
} else {
	module.exports = app;
}
