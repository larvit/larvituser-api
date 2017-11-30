'use strict';
const fs	= require('fs');

exports.run = function (req, res) {
	res.setHeader('Content-Type', 'text/markdown');
	res.statusCode	= 200;
	res.end(fs.readFileSync(__dirname + '/../README.md'));
};
