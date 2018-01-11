'use strict';

const	topLogPrefix	= require('winston').appLogPrefix + __filename + ' - ',
	async	= require('async'),
	log	= require('winston'),
	db	= require('larvitdb');

function createOrReplaceRight(req, res, cb) {
	const	dbFields	= [],
		tasks	= [];

	let	logPrefix	= topLogPrefix	+ 'createOrReplaceRight() - ',
		sql	= 'REPLACE INTO user_roles_rights (role, uri) VALUES';

	log.verbose(logPrefix + 'rawBody: ' + req.rawBody);

	res.statusCode	= 204;

	if ( ! Array.isArray(req.jsonBody)) {
		res.statusCode	= 400;
		res.data	= 'Bad Request\nBody must be a JSON array of objects where each object is only one key and one value, given body is not an array';
		return cb();
	}

	for (let i = 0; req.jsonBody[i] !== undefined; i ++) {
		if (Object.keys(req.jsonBody[i]).length !== 1) {
			res.statusCode	= 400;
			res.data	= 'Bad Request\nBody must be a JSON array of objects where each object is only one key and one value, given body is an array, but one or more objects does not match the criteria';
			return cb();
		}

		for (const keyName of Object.keys(req.jsonBody[i])) {
			const	curValue	= req.jsonBody[i][keyName];

			// Check indata integrity
			if (keyName.trim().length === 0) {
				res.statusCode	= 422;
				res.data	= 'Unprocessable Entity\nRole must not be an empty string after whitespaces have been trimmed';
				return cb();
			}

			try {
				new RegExp(curValue);
			} catch (err) {
				res.statusCode	= 422;
				res.data	= 'Unprocessable Entity\nThe string "' + curValue + '" is not a valid regExp expression';
				return cb();
			}

			sql += '(?,?),';
			dbFields.push(keyName.trim());
			dbFields.push(curValue);
		}
	}

	if (dbFields.length) {
		tasks.push(function (cb) {
			sql	= sql.substring(0, sql.length - 1);
			db.query(sql, dbFields, cb);
		});
	}

	async.series(tasks, cb);
}

function deleteRight(req, res, cb) {
	const	dbFields	= [],
		tasks	= [];

	let	logPrefix	= topLogPrefix	+ 'deleteRight() - ',
		sql	= 'DELETE FROM user_roles_rights WHERE 1 = 2 OR';

	log.verbose(logPrefix + 'rawBody: ' + req.rawBody);

	res.statusCode	= 204;

	if ( ! Array.isArray(req.jsonBody)) {
		res.statusCode	= 400;
		res.data	= 'Bad Request\nBody must be a JSON array of objects where each object is only one key and one value, given body is not an array';
		return cb();
	}

	for (let i = 0; req.jsonBody[i] !== undefined; i ++) {
		if (Object.keys(req.jsonBody[i]).length !== 1) {
			res.statusCode	= 400;
			res.data	= 'Bad Request\nBody must be a JSON array of objects where each object is only one key and one value, given body is an array, but one or more objects does not match the criteria';
			return cb();
		}

		for (const keyName of Object.keys(req.jsonBody[i])) {
			const	curValue	= req.jsonBody[i][keyName];

			// Check indata integrity
			if (keyName.trim().length === 0) {
				res.statusCode	= 422;
				res.data	= 'Unprocessable Entity\nRole must not be an empty string after whitespaces have been trimmed';
				return cb();
			}

			sql += ' (role = ? AND uri = ?) OR';
			dbFields.push(keyName.trim());
			dbFields.push(curValue);
		}
	}

	if (dbFields.length) {
		tasks.push(function (cb) {
			sql	= sql.substring(0, sql.length - 3);
			db.query(sql, dbFields, cb);
		});
	}

	async.series(tasks, cb);
}

function getRolesRights(req, res, cb) {
	db.query('SELECT * FROM user_roles_rights ORDER BY role', function (err, rows) {
		if (err) return cb(err);

		res.data	= [];

		for (let i = 0; rows[i] !== undefined; i ++) {
			const	bodyPart	= {},
				row	= rows[i];

			bodyPart[row.role]	= row.uri;

			res.data.push(bodyPart);
		}

		cb();
	});
}

function controller(req, res, cb) {
	if (req.method.toUpperCase() === 'GET') {
		getRolesRights(req, res, cb);
	} else if (req.method.toUpperCase() === 'PUT') {
		createOrReplaceRight(req, res, cb);
	} else if (req.method.toUpperCase() === 'DELETE') {
		deleteRight(req, res, cb);
	} else {
		res.statusCode	= 405;
		res.data	= 'Method Not Allowed\nAllowed method(s): GET, PUT, DELETE';
		cb();
	}

	return;
};

exports = module.exports = controller;
