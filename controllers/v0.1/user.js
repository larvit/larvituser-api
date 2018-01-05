'use strict';

const topLogPrefix = 'larvituser-api: ./controllers/api/v0.1/user.js - ',
	userLib	= require('larvituser'),
	lUtils	= require('larvitutils'),
	//utils	= require(__dirname + '/../../utils.js'),
	async	= require('async'),
	log	= require('winston');

function createOrReplaceUser(req, res, cb) {
	const	tasks	= [];

	let	logPrefix	= topLogPrefix	+ 'createOrReplaceUser() - ',
		user;

	log.verbose(logPrefix + 'rawBody: ' + req.rawBody);

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
		res.statusCode	= 400;
		res.data	= 'Bad Request\nUsername to long; maximum 191 UTF-8 characters allowed';
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
		if (user) return cb();

		userLib.create(req.jsonBody.username, String(req.jsonBody.password), req.jsonBody.fields, req.jsonBody.uuid, function (err, result) {
			if (err) return cb(err);
			user	= result;
			log.debug(logPrefix + 'New user created');
			cb();
		});
	});

	// Set username if it has changed
	tasks.push(function (cb) {
		if (user.username === req.jsonBody.username) return cb();

		user.setUsername(req.jsonBody.username, cb);
	});

	// Set fields
	tasks.push(function (cb) {
		user.replaceFields(req.jsonBody.fields, function (err) {
			if (err) return cb(err);
			log.debug(logPrefix + 'Fields replaced');
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) return cb(err);
		res.data	= user;
		cb();
	});
}

function deleteUser(req, res, cb) {
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

function getUser(req, res, cb) {
	if (req.urlParsed.query.uuid && req.urlParsed.query.username) {
		res.statusCode	= 422;
		res.data	= 'Unprocessable Entity\nOnly one of uuid and username is allowed at every single request';
		return cb();
	} else if ( ! req.urlParsed.query.uuid && ! req.urlParsed.query.username) {
		res.statusCode	= 422;
		res.data	= 'Unprocessable Entity\nURL parameters uuid or username is required';
		return cb();
	}

	// Check uuid for validity
	if (req.urlParsed.query.uuid) {
		req.urlParsed.query.uuid	= lUtils.formatUuid(req.urlParsed.query.uuid);

		if (req.urlParsed.query.uuid === false) {
			res.statusCode	= 400;
			res.data	= 'Bad Request\nProvided uuid has an invalid format';
			return cb();
		}

		// Fetch user
		userLib.fromUuid(req.urlParsed.query.uuid, function (err, user) {
			if (err) return cb(err);

			if ( ! user) {
				res.statusCode	= 404;
				res.data	= 'Not Found';
				return cb();
			}

			res.data	= user;
			cb();
		});
	} else if (req.urlParsed.query.username) {
		req.urlParsed.query.username	= String(req.urlParsed.query.username);

		// Fetch user
		userLib.fromUsername(req.urlParsed.query.username, function (err, user) {
			if (err) return cb(err);

			if ( ! user) {
				res.statusCode	= 404;
				res.data	= 'Not Found';
				return cb();
			}

			res.data	= user;
			cb();
		});
	}
}

function patchUser(req, res, cb) {
	const	logPrefix	 = topLogPrefix + 'patchUser() - ',
		tasks	= [];

	let	user;

	res.statusCode	= 200;

	// Check uuid for validity
	req.jsonBody.uuid	= lUtils.formatUuid(req.jsonBody.uuid);

	if (req.jsonBody.uuid === false) {
		res.statusCode	= 400;
		res.data	= 'Bad Request\nProvided uuid has an invalid format';
		return cb();
	}

	// Check username for validity
	if (req.jsonBody.username) {
		req.jsonBody.username	= String(req.jsonBody.username).trim();

		if (req.jsonBody.username === '') {
			res.statusCode	= 422;
			res.data	= 'Unprocessable Entity\nUsername must contain at least one non-space character';
			return cb();
		}
	}

	// Fetch user
	tasks.push(function (cb) {
		userLib.fromUuid(req.jsonBody.uuid, function (err, result) {
			if (err) return cb(err);
			user	= result;
			cb();
		});
	});

	// Check so new username is available
	// IMPORTANT!!! That this happends before updating fields!
	tasks.push(function (cb) {
		if ( ! user || ! req.jsonBody.username || req.jsonBody.username === user.username) {
			return cb();
		}

		userLib.usernameAvailable(req.jsonBody.username, function (err, result) {
			if (err) return cb(err);

			if ( ! result) {
				log.verbose(logPrefix + 'Username "' + req.jsonBody.username + '" is already taken by another user');
				res.statusCode	= 422;
				res.data	= 'Unprocessable Entity\nUsername is taken by another user';
			}

			cb();
		});
	});

	// Update fields
	tasks.push(function (cb) {
		const	newFields	= {};

		if ( ! user || ! req.jsonBody.fields) return cb();

		for (const fieldName of Object.keys(user.fields)) {
			newFields[fieldName]	= user.fields[fieldName];
		}

		for (const fieldName of Object.keys(req.jsonBody.fields)) {
			newFields[fieldName]	= req.jsonBody.fields[fieldName];
		}

		user.replaceFields(newFields, cb);
	});

	// Update username
	tasks.push(function (cb) {
		if ( ! user || ! req.jsonBody.username || req.jsonBody.username === user.username || res.statusCode !== 200) {
			return cb();
		}

		user.setUsername(req.jsonBody.username, cb);
	});

	async.series(tasks, function (err) {
		if (err) return cb(err);

		if ( ! user) {
			res.statusCode	= 404;
			res.data	= 'Not Found';
		}

		res.data	= user;
		cb();
	});
}

function controller(req, res, cb) {
	if (req.method.toUpperCase() === 'GET') {
		getUser(req, res, cb);
	} else if (req.method.toUpperCase() === 'PUT') {
		createOrReplaceUser(req, res, cb);
	} else if (req.method.toUpperCase() === 'DELETE') {
		deleteUser(req, res, cb);
	} else if (req.method.toUpperCase() === 'PATCH') {
		patchUser(req, res, cb);
	} else {
		res.statusCode	= 405;
		res.data	= '405 Method Not Allowed\nAllowed methods: GET, PUT, PATCH, DELETE';
		cb();
	}

	return;
	/*
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
	*/
};

exports = module.exports = controller;
