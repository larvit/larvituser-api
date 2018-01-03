'use strict';

const logPrefix = 'larvituser-api ./controllers/api/v0.1/user.js - ',
	userLib	= require('larvituser'),
	utils	= require(__dirname + '/../../utils.js'),
	async	= require('async'),
	log	= require('winston');

exports.run = function (req, res, cb) {
	const	tasks = [];

	let result,
		responseSent = false;

	// get user
	if (req.method.toUpperCase() === 'GET') {
		tasks.push(function (cb) {
			if ( ! req.urlParsed.query.uuid) {
				utils.createErrorResponse(res, 400, 'User uuid missing');
				responseSent = true;
				return cb();
			}

			log.debug(logPrefix + 'Looking for user with uuid "' + req.urlParsed.query.uuid + '"');

			userLib.fromUuid(req.urlParsed.query.uuid, function (err, user) {
				if (err  && err.message === 'Invalid userUuid') {
					utils.createErrorResponse(res, 400, 'Invalid uuid');
					responseSent = true;
					return cb();
				} else if (err) {
					return cb(err);
				}

				result = user;
				cb();
			});
		});
	// create user
	} else if (req.method.toUpperCase() === 'POST') {
		let data;

		// parse request body
		tasks.push(function (cb) {
			utils.parseJsonRequest(req, function (err, result) {
				if (err) {
					utils.createErrorResponse(res, 400, 'Bad json');
					responseSent = true;
					return cb();
				}

				log.debug(logPrefix + 'Trying to create new user with data "' + JSON.stringify(result) + '"');

				data = result;
				cb();
			});
		});

		// check if username is available
		tasks.push(function (cb) {
			if (responseSent) return cb();

			if ( ! data.username) {
				utils.createErrorResponse(res, 400, 'Username required');
				responseSent = true;
				return cb();
			}


			userLib.usernameAvailable(data.username, function (err, isAvailable) {
				if (err) return cb(err);

				if ( ! isAvailable) {
					utils.createErrorResponse(res, 403, 'Username taken');
					responseSent = true;
					return cb();
				}

				cb();
			});
		});

		// add validation here
		tasks.push(function (cb) {
			cb();
		});

		// create user
		tasks.push(function (cb) {
			if (responseSent) return cb();

			userLib.create(data.username, data.password || false, data.fields, function (err, newUser) {
				if (err) return cb(err);

				result = newUser;
				res.statusCode = 201;
				cb();
			});
		});
	// update user
	} else if (req.method.toUpperCase() === 'PUT') {
		let data,
			user;

		// parse request body
		tasks.push(function (cb) {
			utils.parseJsonRequest(req, function (err, result) {
				if (err) {
					utils.createErrorResponse(res, 400, 'Bad json');
					responseSent = true;
					return cb();
				}

				log.debug(logPrefix + 'Trying to update user with data "' + JSON.stringify(result) + '"');
				data = result;
				cb();
			});
		});

		// fetch user from db
		tasks.push(function (cb) {
			if (responseSent) return cb();

			if ( ! data.uuid) {
				utils.createErrorResponse(res, 400, 'User uuid missing');
				responseSent = true;
				return cb();
			}

			userLib.fromUuid(data.uuid, function (err, u) {
				if (err && err.message === 'Invalid userUuid') {
					utils.createErrorResponse(res, 400, 'Invalid uuid');
					responseSent = true;
					return cb();
				} else if (err) {
					return cb(err);
				}

				user = u;
				cb();
			});
		});

		// update user
		tasks.push(function (cb) {
			const tasks = [];

			if (responseSent) return cb();

			if (data.fields) {
				tasks.push(function (cb) {
					user.replaceFields(data.fields, cb);
				});
			}

			if (data.password) {
				tasks.push(function (cb) {
					user.setPassword(data.password, cb);
				});
			}

			if (data.username && data.username !== user.username) {
				tasks.push(function (cb) {
					userLib.usernameAvailable(data.username, function (err, isAvailable) {
						if (err) return cb(err);

						if ( ! isAvailable) {
							utils.createErrorResponse(res, 403, 'Username taken');
							responseSent = true;
							return cb();
						}

						userLib.setUsername(data.username, cb);
					});
				});
			}

			// load user from db and return
			tasks.push(function (cb) {
				userLib.fromUuid(data.uuid, function (err, user) {
					if (err) return cb(err);
					result = user;
					cb();
				});
			});

			async.series(tasks, cb);
		});
	} else {
		utils.createErrorResponse(res, 405);
	}

	async.series(tasks, function (err) {
		if (err) {
			utils.createErrorResponse(res, 500);
			responseSent = true;
		}

		if ( ! responseSent) cb(err, req, res, result);
	});
};
