'use strict';

exports = module.exports = async function (req, res, cb) {
	const topLogPrefix = req.log.appLogPrefix + __filename + ' - ';

	if (req.method.toUpperCase() !== 'GET') {
		req.log.info(topLogPrefix + 'Got request with unallowed method: "' + req.method + '", query: "' + req.urlParsed.href + '"');
		res.setHeader('Content-Type', 'text/plain');
		res.statusCode = 405;
		res.data = '"Method not allowed"';

		return cb();
	}

	req.log.verbose(topLogPrefix + 'Got request for users with query "' + req.urlParsed.href + '"');

	const usersOptions = {};

	usersOptions.q = req.urlParsed.query.q;
	usersOptions.uuids = req.urlParsed.query.uuids;
	usersOptions.limit = req.urlParsed.query.limit;
	usersOptions.offset = req.urlParsed.query.offset;
	usersOptions.returnFields = req.urlParsed.query.returnFields;

	// Parse comma separated uuids if it is a string
	if (usersOptions.uuids && typeof usersOptions.uuids === 'string') {
		usersOptions.uuids = usersOptions.uuids.split(',');
		usersOptions.uuids = usersOptions.uuids.map(uuid => uuid.trim());
	}

	// Parse comma separated return fields if it is a string
	if (usersOptions.returnFields && typeof usersOptions.returnFields === 'string') {
		usersOptions.returnFields = usersOptions.returnFields.split(',');
		usersOptions.returnFields = usersOptions.returnFields.map(field => field.trim());
	}

	if (req.urlParsed.query.matchAllFields && req.urlParsed.query.matchAllFieldsValues) {
		usersOptions.matchAllFields = {};

		if (Array.isArray(req.urlParsed.query.matchAllFields) && Array.isArray(req.urlParsed.query.matchAllFieldsValues)) {
			for (let i = 0; i < req.urlParsed.query.matchAllFields.length; i++) {
				usersOptions.matchAllFields[req.urlParsed.query.matchAllFields[i]] = req.urlParsed.query.matchAllFieldsValues[i];
			}
		} else {
			usersOptions.matchAllFields[req.urlParsed.query.matchAllFields] = req.urlParsed.query.matchAllFieldsValues;
		}
	}

	if (req.urlParsed.query.matchAllFieldsQ && req.urlParsed.query.matchAllFieldsQValues) {
		usersOptions.matchAllFieldsQ = {};

		if (Array.isArray(req.urlParsed.query.matchAllFieldsQ) && Array.isArray(req.urlParsed.query.matchAllFieldsQValues)) {
			for (let i = 0; i < req.urlParsed.query.matchAllFieldsQ.length; i++) {
				usersOptions.matchAllFieldsQ[req.urlParsed.query.matchAllFieldsQ[i]] = req.urlParsed.query.matchAllFieldsQValues[i];
			}
		} else {
			usersOptions.matchAllFieldsQ[req.urlParsed.query.matchAllFieldsQ] = req.urlParsed.query.matchAllFieldsQValues;
		}
	}

	if (req.urlParsed.query.orderBy) {
		usersOptions.order = {
			by: req.urlParsed.query.orderBy
		};

		if (req.urlParsed.query.orderDirection) usersOptions.order.direction = req.urlParsed.query.orderDirection;
	}

	const {users: usersResult, totalElements} = await req.userLib.getUsers(usersOptions);

	res.data = {
		totalElements: totalElements,
		result: usersResult
	};

	return cb();
};
