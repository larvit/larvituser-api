'use strict';
const lUtils = new (require('larvitutils').Utils)();
const async = require('async');

function createOrReplaceUser(req, res, cb) {
	const tasks = [];
	let logPrefix = req.log.appLogPrefix + __filename + ' - createOrReplaceUser() - ';
	let user;

	req.log.verbose(`${logPrefix} uuid: ${req.jsonBody.uuid}, username: ${req.jsonBody.username}, fields: ${JSON.stringify(req.jsonBody.fields)}`);

	res.statusCode = 200;

	// Check uuid for validity
	if (req.jsonBody.uuid) {
		req.jsonBody.uuid = lUtils.formatUuid(req.jsonBody.uuid);

		if (req.jsonBody.uuid === false) {
			res.statusCode = 400;
			res.data = 'Bad Request\nProvided uuid has an invalid format';

			return cb();
		}
	}

	if (req.jsonBody.username) {
		req.jsonBody.username = String(req.jsonBody.username).trim();

		if (req.jsonBody.username.length > 191) {
			res.statusCode = 422;
			res.data = 'Unprocessable Entity\nUsername to long; maximum 191 UTF-8 characters allowed';

			return cb();
		}
	}

	// Check if user exists on given uuid, otherwise create it
	if (req.jsonBody.uuid) {
		logPrefix += 'userUuid: ' + req.jsonBody.uuid + ' - ';

		tasks.push(async function () {
			req.log.debug(logPrefix + 'Trying to load previous user');

			const result = await req.userLib.fromUuid(req.jsonBody.uuid);
			if (result) {
				req.log.debug(logPrefix + 'Previous user found, username: "' + result.username + '"');
				user = result;
			}
		});
	}

	// Check so username is a valid string (only required if uuid is not specified and user is not found)
	tasks.push(function (cb) {
		if (res.statusCode !== 200 || user) return cb();

		if (!req.jsonBody.username || String(req.jsonBody.username).trim() === '') {
			res.statusCode = 400;
			res.data = 'Bad Request\nNo username provided';

			return cb();
		}

		return cb();
	});

	// Check username availibility
	tasks.push(async function () {
		if (res.statusCode !== 200 || !req.jsonBody.username) return;

		if (user && user.username === req.jsonBody.username) {
			req.log.debug(logPrefix + 'Previous user loaded and username change is not requested, moving on');

			return;
		}

		const result = await req.userLib.usernameAvailable(req.jsonBody.username);
		if (!result) {
			req.log.verbose(logPrefix + 'Username "' + req.jsonBody.username + '" is already taken by another user');
			res.statusCode = 422;
			res.data = 'Unprocessable Entity\nUsername is taken by another user';
		} else {
			req.log.debug(logPrefix + 'Username is available, moving on');
		}
	});

	// Set username if it has changed and there is an existing user
	tasks.push(async function () {
		if (!user || (!req.jsonBody.username || (user && user.username === req.jsonBody.username)) || res.statusCode !== 200) {
			return;
		}

		await user.setUsername(req.jsonBody.username);
		user.username = req.jsonBody.username;
	});

	// Set fields if there is an existing user
	tasks.push(async function () {
		if (!user || res.statusCode !== 200) return;

		await user.replaceFields(req.jsonBody.fields);
		req.log.debug(logPrefix + 'Fields replaced');
	});

	// Create new user if needed
	tasks.push(async function () {
		if (user || res.statusCode !== 200) return;

		const result = await req.userLib.create(req.jsonBody.username, String(req.jsonBody.password), req.jsonBody.fields, req.jsonBody.uuid);
		user = result;
		req.log.debug(logPrefix + 'New user created');
	});

	async.series(tasks, function (err) {
		if (err) return cb(err);
		if (res.statusCode === 200) {
			res.data = {
				fields: user.fields,
				uuid: user.uuid,
				username: user.username,
				passwordIsFalse: user.passwordIsFalse
			};
		}
		cb();
	});
}

async function deleteUser(req, res, cb) {
	// Check uuid for validity
	req.jsonBody.uuid = lUtils.formatUuid(req.jsonBody.uuid);

	if (req.jsonBody.uuid === false) {
		res.statusCode = 400;
		res.data = 'Bad Request\nProvided uuid has an invalid format';

		return cb();
	}

	try {
		await req.userLib.rmUser(req.jsonBody.uuid);
		res.data = 'acknowledged';
	} catch (err) {
		return cb(err);
	}

	return cb();
}

async function getUser(req, res, cb) {
	if (req.urlParsed.query.uuid && req.urlParsed.query.username) {
		res.statusCode = 400;
		res.data = 'Bad Request\nOnly one of uuid and username is allowed at every single request';

		return cb();
	} else if (!req.urlParsed.query.uuid && !req.urlParsed.query.username) {
		res.statusCode = 400;
		res.data = 'Bad Request\nURL parameters uuid or username is required';

		return cb();
	}

	// Check uuid for validity
	if (req.urlParsed.query.uuid) {
		req.urlParsed.query.uuid = lUtils.formatUuid(req.urlParsed.query.uuid);

		if (req.urlParsed.query.uuid === false) {
			res.statusCode = 400;
			res.data = 'Bad Request\nProvided uuid has an invalid format';

			return cb();
		}

		// Fetch user
		try {
			const user = await req.userLib.fromUuid(req.urlParsed.query.uuid);
			if (!user) {
				res.statusCode = 404;
				res.data = 'Not Found';
			} else {
				res.data = {
					fields: user.fields,
					uuid: user.uuid,
					username: user.username,
					passwordIsFalse: user.passwordIsFalse
				};
			}
		} catch (err) {
			return cb(err);
		}

		return cb();
	} else if (req.urlParsed.query.username) {
		req.urlParsed.query.username = String(req.urlParsed.query.username);

		// Fetch user
		try {
			const user = await req.userLib.fromUsername(req.urlParsed.query.username);
			if (!user) {
				res.statusCode = 404;
				res.data = 'Not Found';

				return cb();
			} else {
				res.data = {
					fields: user.fields,
					uuid: user.uuid,
					username: user.username,
					passwordIsFalse: user.passwordIsFalse
				};
			}
		} catch (err) {
			return cb(err);
		}

		return cb();
	}
}

function patchUser(req, res, cb) {
	const logPrefix = req.log.appLogPrefix + __filename + ' - patchUser() - ';
	const tasks = [];

	let user;

	res.statusCode = 200;

	// Check uuid for validity
	req.jsonBody.uuid = lUtils.formatUuid(req.jsonBody.uuid);

	if (req.jsonBody.uuid === false) {
		res.statusCode = 400;
		res.data = 'Bad Request\nProvided uuid has an invalid format';

		return cb();
	}

	// Check username length
	if (req.jsonBody.username && req.jsonBody.username.length > 191) {
		res.statusCode = 422;
		res.data = 'Unprocessable Entity\nUsername to long; maximum 191 UTF-8 characters allowed';

		return cb();
	}

	// Check username for validity
	if (req.jsonBody.username) {
		req.jsonBody.username = String(req.jsonBody.username).trim();

		if (req.jsonBody.username === '') {
			res.statusCode = 422;
			res.data = 'Unprocessable Entity\nUsername must contain at least one non-space character';

			return cb();
		}
	}

	// Fetch user
	tasks.push(async function () {
		const result = await req.userLib.fromUuid(req.jsonBody.uuid);
		user = result;
	});

	// Check so new username is available
	// IMPORTANT!!! That this happends before updating fields!
	tasks.push(async function () {
		if (!user || !req.jsonBody.username || req.jsonBody.username === user.username) {
			return;
		}

		const result = await req.userLib.usernameAvailable(req.jsonBody.username);
		if (!result) {
			req.log.verbose(logPrefix + 'Username "' + req.jsonBody.username + '" is already taken by another user');
			res.statusCode = 422;
			res.data = 'Unprocessable Entity\nUsername is taken by another user';
		}
	});

	// Update password if specified
	if (req.jsonBody.password !== undefined && req.jsonBody.password !== null) {
		tasks.push(async function () {
			if (!user || res.statusCode !== 200) return;

			await req.userLib.setPassword(user.uuid, req.jsonBody.password);
		});
	}

	// Update fields
	tasks.push(async function () {
		const newFields = {};

		if (!user || !req.jsonBody.fields || res.statusCode !== 200) return;

		for (const fieldName of Object.keys(user.fields)) {
			newFields[fieldName] = user.fields[fieldName];
		}

		for (const fieldName of Object.keys(req.jsonBody.fields)) {
			newFields[fieldName] = req.jsonBody.fields[fieldName];
		}

		await user.replaceFields(newFields);
	});

	// Update username
	tasks.push(async function () {
		if (!user || !req.jsonBody.username || req.jsonBody.username === user.username || res.statusCode !== 200) {
			return;
		}

		await user.setUsername(req.jsonBody.username);
	});

	async.series(tasks, function (err) {
		if (err) return cb(err);

		if (!user) {
			res.statusCode = 404;
			res.data = 'Not Found';
		}

		if (res.statusCode === 200) {
			res.data = {
				fields: user.fields,
				uuid: user.uuid,
				username: user.username,
				passwordIsFalse: user.passwordIsFalse
			};
		}

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
		res.statusCode = 405;
		res.data = 'Method Not Allowed\nAllowed method(s): GET, PUT, PATCH, DELETE';
		cb();
	}

	return;
};

exports = module.exports = controller;
