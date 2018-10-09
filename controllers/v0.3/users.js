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

			res.data = users;

			cb(err);
		});
	});

	async.parallel(tasks, function (err) {
		cb(err);
	});
};
