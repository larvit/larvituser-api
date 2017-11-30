'use strict';
const fs	= require('fs');

exports.run = function (req, res) {
	res.setHeader('Content-Type', 'text/plain');
	res.statusCode	= 200;
	res.end(fs.readFileSync(__dirname + '/../README.md'));
};
