'use strict';

const async = require('async');
const UserLib = require('larvituser');

exports = module.exports = function (req, res, cb) {
	const tasks = [];
	const topLogPrefix = req.log.appLogPrefix + __filename + ' - ';

	if (req.method.toUpperCase() !== 'GET') {
		req.log.info(topLogPrefix + 'Got request with unallowed method: "' + req.method + '", query: "' + req.urlParsed.href + '"');
		res.setHeader('Content-Type', 'text/plain');
		res.statusCode = 405;
		res.data = '"Method not allowed"';

		return cb();
	}

	req.log.verbose(topLogPrefix + 'Got request for users with query "' + req.urlParsed.href + '"');

	tasks.push(function (cb) {
		const users = new UserLib.Users({
			db: req.db,
			log: req.log
		});

		users.q = req.urlParsed.query.q;
		users.uuids = req.urlParsed.query.uuids;
		users.limit = req.urlParsed.query.limit;
		users.offset = req.urlParsed.query.offset;
		users.returnFields = req.urlParsed.query.returnFields;

		// Parse comma separated uuids if it is a string
		if (users.uuids && typeof users.uuids === 'string') {
			users.uuids = users.uuids.split(',');
			users.uuids = users.uuids.map(uuid => uuid.trim());
		}

		// Parse comma separated return fields if it is a string
		if (users.returnFields && typeof users.returnFields === 'string') {
			users.returnFields = users.returnFields.split(',');
			users.returnFields = users.returnFields.map(field => field.trim());
		}

		if (req.urlParsed.query.matchAllFields && req.urlParsed.query.matchAllFieldsValues) {
			users.matchAllFields = {};

			if (Array.isArray(req.urlParsed.query.matchAllFields) && Array.isArray(req.urlParsed.query.matchAllFieldsValues)) {
				for (let i = 0; i < req.urlParsed.query.matchAllFields.length; i++) {
					users.matchAllFields[req.urlParsed.query.matchAllFields[i]] = req.urlParsed.query.matchAllFieldsValues[i];
				}
			} else {
				users.matchAllFields[req.urlParsed.query.matchAllFields] = req.urlParsed.query.matchAllFieldsValues;
			}
		}

		if (req.urlParsed.query.matchAllFieldsQ && req.urlParsed.query.matchAllFieldsQValues) {
			users.matchAllFieldsQ = {};

			if (Array.isArray(req.urlParsed.query.matchAllFieldsQ) && Array.isArray(req.urlParsed.query.matchAllFieldsQValues)) {
				for (let i = 0; i < req.urlParsed.query.matchAllFieldsQ.length; i++) {
					users.matchAllFieldsQ[req.urlParsed.query.matchAllFieldsQ[i]] = req.urlParsed.query.matchAllFieldsQValues[i];
				}
			} else {
				users.matchAllFieldsQ[req.urlParsed.query.matchAllFieldsQ] = req.urlParsed.query.matchAllFieldsQValues;
			}
		}

		if (req.urlParsed.query.orderBy) {
			users.order = {
				by: req.urlParsed.query.orderBy
			};

			if (req.urlParsed.query.orderDirection) users.order.direction = req.urlParsed.query.orderDirection;
		}

		users.get(function (err, usersResult, totalElements) {
			if (err) return cb(err);

			// This should probably be fixed in larvituser instead but is a breaking change
			// For backwards compatibility field must be set on user object and on user.fields object
			if (users.returnFields) {
				for (const user of usersResult) {
					user.fields = {};

					for (const rf of users.returnFields) {
						user.fields[rf] = user[rf];
					}
				}
			}

			res.data = {
				totalElements: totalElements,
				result: usersResult
			};

			cb();
		});
	});

	async.parallel(tasks, function (err) {
		cb(err);
	});
};
