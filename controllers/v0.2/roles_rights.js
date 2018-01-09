'use strict';

const topLogPrefix = 'larvituser-api: ./controllers/api/v0.3/roles_rights.js - ',
	userLib	= require('larvituser'),
	lUtils	= require('larvitutils'),
	async	= require('async'),
	log	= require('winston'),
	db	= require('larvitdb');

function createOrReplaceRight(req, res, cb) {
	const	tasks	= [];

	let	logPrefix	= topLogPrefix	+ 'createOrReplaceRight() - ',
		user;

	log.verbose(logPrefix + 'rawBody: ' + req.rawBody);

	res.statusCode	= 200;

	// Check uuid for validity
	if (req.jsonBody.uuid) {
		req.jsonBody.uuid	= lUtils.formatUuid(req.jsonBody.uuid);

		if (req.jsonBody.uuid === false) {
			res.statusCode	= 400;
			res.data	= 'Bad Request\nProvided uuid has an invalid format';
			return cb();
		}
	}

	// Check so username is a valid string
	if ( ! req.jsonBody.username || String(req.jsonBody.username).trim() === '') {
		res.statusCode	= 400;
		res.data	= 'Bad Request\nNo username provided';
		return cb();
	}

	req.jsonBody.username	= String(req.jsonBody.username).trim();

	if (req.jsonBody.username.length > 191) {
		res.statusCode	= 422;
		res.data	= 'Unprocessable Entity\nUsername to long; maximum 191 UTF-8 characters allowed';
		return cb();
	}

	// Check if user exists on given uuid, otherwise create it
	if (req.jsonBody.uuid) {
		logPrefix += 'userUuid: ' + req.jsonBody.uuid + ' - ';

		tasks.push(function (cb) {
			log.debug(logPrefix + 'Trying to load previous user');
			userLib.fromUuid(req.jsonBody.uuid, function (err, result) {
				if (err) return cb(err);

				if (result) {
					log.debug(logPrefix + 'Previous user found, username: "' + result.username + '"');
					user	= result;
				}
				cb();
			});
		});
	}

	// Check username availibility
	tasks.push(function (cb) {
		if (user && user.username === req.jsonBody.username) {
			log.debug(logPrefix + 'Previous user loaded and username change is not requested, moving on');
			return cb();
		}

		userLib.usernameAvailable(req.jsonBody.username, function (err, result) {
			if (err) return cb(err);

			if ( ! result) {
				log.verbose(logPrefix + 'Username "' + req.jsonBody.username + '" is already taken by another user');
				res.statusCode	= 422;
				res.data	= 'Unprocessable Entity\nUsername is taken by another user';
				return cb();
			}

			log.debug(logPrefix + 'Username is available, moving on');

			cb();
		});
	});

	// Create new user if needed
	tasks.push(function (cb) {
		if (user || res.statusCode !== 200) return cb();

		userLib.create(req.jsonBody.username, String(req.jsonBody.password), req.jsonBody.fields, req.jsonBody.uuid, function (err, result) {
			if (err) return cb(err);
			user	= result;
			log.debug(logPrefix + 'New user created');
			cb();
		});
	});

	// Set username if it has changed
	tasks.push(function (cb) {
		if ((user && user.username === req.jsonBody.username) || res.statusCode !== 200) {
			return cb();
		}

		user.setUsername(req.jsonBody.username, cb);
	});

	// Set fields
	tasks.push(function (cb) {
		if (res.statusCode !== 200) return cb();

		user.replaceFields(req.jsonBody.fields, function (err) {
			if (err) return cb(err);
			log.debug(logPrefix + 'Fields replaced');
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) return cb(err);
		if (res.statusCode === 200) res.data	= user;
		cb();
	});
}

function deleteRight(req, res, cb) {
	// Check uuid for validity
	req.jsonBody.uuid	= lUtils.formatUuid(req.jsonBody.uuid);

	if (req.jsonBody.uuid === false) {
		res.statusCode	= 400;
		res.data	= 'Bad Request\nProvided uuid has an invalid format';
		return cb();
	}

	userLib.rmUser(req.urlParsed.query.uuid, function (err) {
		if (err) return cb(err);
		res.data	= 'acknowledged';
		cb();
	});
}

function getRolesRights(req, res, cb) {
	db.query('SELECT * FROM user_roles_rights ORDER BY role', function (err, rows) {
		if (err) return cb(err);

		for (let i = 0; rows[i] !== undefined; i ++) {
			const	row	= rows[i];

			res.body[row.role]	= row.uri;
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
