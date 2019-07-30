'use strict';

const async = require('async');
const UserLib = require('larvituser');

exports = module.exports = function (req, res, cb) {
	const	tasks = [];
	const topLogPrefix = req.log.appLogPrefix + __filename + ' - ';

	if (req.method.toUpperCase() !== 'GET') {
		req.log.info(topLogPrefix + 'Got request with unallowed method: "' + req.method + '", query: "' + req.urlParsed.href + '"');
		res.setHeader('Content-Type', 'text/plain');
		res.statusCode	= 405;
		res.data = '"Method not allowed"';

		return cb();
	}

	req.log.verbose(topLogPrefix + 'Got request for users with query "' + req.urlParsed.href + '"');

	tasks.push(function (cb) {
		const users = new UserLib.Users({
			'db': req.db,
			'log': req.log
		});

		users.q	= req.urlParsed.query.q;
		users.uuids	= req.urlParsed.query.uuids;
		users.limit	= req.urlParsed.query.limit;
		users.offset	= req.urlParsed.query.offset;

		// Set return fields
		if (req.urlParsed.query.returnFields !== undefined) {
			users.returnFields = req.urlParsed.query.returnFields.split(',');

			for (let i = 0; users.returnFields[i] !== undefined; i ++) {
				users.returnFields[i] = users.returnFields[i].trim();
			}
		}

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

		if (req.urlParsed.query.matchAllFieldsQ && req.urlParsed.query.matchAllFieldsQValues) {
			users.matchAllFieldsQ = {};

			if (Array.isArray(req.urlParsed.query.matchAllFieldsQ) && Array.isArray(req.urlParsed.query.matchAllFieldsQValues)) {
				for (let i = 0; i < req.urlParsed.query.matchAllFieldsQ.length; i ++) {
					users.matchAllFieldsQ[req.urlParsed.query.matchAllFieldsQ[i]] = req.urlParsed.query.matchAllFieldsQValues[i];
				}
			} else {
				users.matchAllFieldsQ[req.urlParsed.query.matchAllFieldsQ] = req.urlParsed.query.matchAllFieldsQValues;
			}
		}

		if (req.urlParsed.query.orderBy) {
			users.order = {
				'by': req.urlParsed.query.orderBy
			};

			if (req.urlParsed.query.orderDirection) users.order.direction = req.urlParsed.query.orderDirection;
		}

		users.get(function (err, users, totalElements) {
			if (err) return cb(err);

			// This should probably be fixed in larvituser instead but is a breaking change
			if (req.urlParsed.query.returnFields) {
				for (const user of users) {
					user.fields = {};

					for (const rf of req.urlParsed.query.returnFields) {
						user.fields[rf] = user[rf];
						delete user[rf];
					}
				}
			}

			res.data = {
				'totalElements': totalElements,
				'result': users
			};

			cb();
		});
	});

	async.parallel(tasks, function (err) {
		cb(err);
	});
};
