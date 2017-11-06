'use strict';

const logPrefix = 'larvituser-api ./controllers/api/v0.1/users.js - ',
	userLib	= require('larvituser'),
	async = require('async');

exports.run = function (req, res, cb) {
	const	tasks = [];

	let result;

	if (req.method.toUpperCase() !== 'GET') {
		res.setHeader('Content-Type', 'text/plain');
		res.statusCode	= 405;
		res.end('Method not allowed');
		return cb(null, req, res, {});
	}

	tasks.push(function (cb) {
		const users = new userLib.Users();
		users.q	= req.urlParsed.query.q;
		users.uuids	= req.urlParsed.query.uuids;
		users.matchAllFields	= req.urlParsed.query.matchAllFields;
		users.limit	= req.urlParsed.query.limit;
		users.offset	= req.urlParsed.query.limit;
		users.returnFields	= req.urlParsed.query.returnFields;

		users.get(function (err, users) {
			result = users;
			cb(err);
		});
	});

	async.parallel(tasks, function (err) {
		cb(err, req, res, result);
	});
};
