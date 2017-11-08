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
		users.limit	= req.urlParsed.query.limit;
		users.offset	= req.urlParsed.query.limit;
		users.returnFields	= req.urlParsed.query.returnFields;

		if (req.urlParsed.query.matchAllFields && req.urlParsed.query.matchAllFieldsValues) {
			users.matchAllFields = {};

			if (Array.isArray(req.urlParsed.query.matchAllFields) && Array.isArray(req.urlParsed.query.matchAllFieldsValues)) {
				for (let i = 0; i < req.urlParsed.query.matchAllFields.length; i ++) {
					users.matchAllFields[req.urlParsed.query.matchAllFields[i]] = req.urlParsed.query.matchAllFieldsValues[i];
				}
			} else {
				users.matchAllFields[req.urlParsed.query.matchAllFields] = req.urlParsed.query.matchAllFieldsValues;
			}
		}

		users.get(function (err, users) {
			result = users;
			cb(err);
		});
	});

	async.parallel(tasks, function (err) {
		cb(err, req, res, result);
	});
};
