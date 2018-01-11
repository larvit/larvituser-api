'use strict';

const	topLogPrefix	= require('winston').appLogPrefix + __filename + ' - ',
	userLib	= require('larvituser'),
	async = require('async'),
	log	= require('winston');

exports = module.exports = function (req, res, cb) {
	const	tasks = [];

	if (req.method.toUpperCase() !== 'POST') {
		log.verbose(topLogPrefix + 'Got request with unallowed method: "' + req.method + '", query: "' + req.urlParsed.href + '"');
		res.statusCode	= 405;
		res.data	= '405 Method Not Allowed\nAllowed methods: POST';
		return cb();
	}

	if ( ! req.jsonBody ||
		 ! req.jsonBody.username ||
		 ! req.jsonBody.password) {

		log.verbose(topLogPrefix + 'Got login request with malformed body');
		res.statusCode = 400;
		res.data = '"400 Malformed request body"';
		return cb();
	}

	log.verbose(topLogPrefix + 'Got request for login for user "' + req.jsonBody.username + '"');

	tasks.push(function (cb) {
		userLib.fromUserAndPass(req.jsonBody.username, req.jsonBody.password, function (err, user) {
			if (err) return cb(err);

			if ( ! user) {
				log.verbose(topLogPrefix + 'Log in failed for usern "' + req.jsonBody.username + '"');
				res.data = false;
				return cb();
			} else {
				log.verbose(topLogPrefix + 'User "' + req.jsonBody.username + '" successfully logged in');
				res.data = user;
				return cb();
			}
		});
	});

	async.parallel(tasks, function (err) {
		cb(err, req, res);
	});
};
