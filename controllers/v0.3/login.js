'use strict';
const async = require('async');

exports = module.exports = function (req, res, cb) {
	const	tasks = [];
	const	topLogPrefix	= req.log.appLogPrefix + __filename + ' - ';

	if (req.method.toUpperCase() !== 'POST') {
		req.log.verbose(topLogPrefix + 'Got request with unallowed method: "' + req.method + '", query: "' + req.urlParsed.href + '"');
		res.statusCode	= 405;
		res.data	= '405 Method Not Allowed\nAllowed methods: POST';

		return cb();
	}

	if (! req.jsonBody ||
		 ! req.jsonBody.username ||
		 ! req.jsonBody.password) {
		req.log.verbose(topLogPrefix + 'Got login request with malformed body');
		res.statusCode = 400;
		res.data = '"400 Malformed request body"';

		return cb();
	}

	req.log.verbose(topLogPrefix + 'Got request for login for user "' + req.jsonBody.username + '"');

	tasks.push(function (cb) {
		req.userLib.fromUserAndPass(req.jsonBody.username, req.jsonBody.password, function (err, user) {
			if (err) return cb(err);

			if (! user) {
				req.log.verbose(topLogPrefix + 'Log in failed for usern "' + req.jsonBody.username + '"');
				res.data = false;

				return cb();
			} else {
				req.log.verbose(topLogPrefix + 'User "' + req.jsonBody.username + '" successfully logged in');
				res.data = {
					'fields': user.fields,
					'uuid': user.uuid,
					'username': user.username,
					'passwordIsFalse': user.passwordIsFalse
				};

				return cb();
			}
		});
	});

	async.parallel(tasks, function (err) {
		cb(err, req, res);
	});
};
