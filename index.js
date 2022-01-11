'use strict';

const topLogPrefix = 'larvituser-api: ' + __filename + ' - ';
const Intercom = require('larvitamintercom');
const UserLib = require('larvituser');
const {Log} = require('larvitutils');
const Api = require('larvitbase-api');

function UserApi(options) {
	const logPrefix = topLogPrefix + 'UserApi() - ';
	const that = this;

	that.options = options;

	if (!that.options) that.options = {};

	if (!that.options.log) {
		that.options.log = new Log('info');
	}

	if (!that.options.db) {
		throw new Error('Db instance not present');
	}

	that.options.log.appLogPrefix = 'larvituser-api: ';
	that.api = new Api(that.options);

	// Parse all incoming data as JSON
	that.api.middleware.splice(1, 0, function (req, res, cb) {
		if (req.method.toUpperCase() !== 'GET' && req.rawBody === undefined) {
			res.statusCode = 400;
			res.end('"Bad Request\nNo body provided"');
			req.log.verbose(logPrefix + 'No body provided.');

			return;
		}

		if (req.rawBody) {
			try {
				req.jsonBody = JSON.parse(req.rawBody.toString());
			} catch (err) {
				res.statusCode = 400;
				res.end('"Bad Request\nProvided body is not a valid JSON string"');
				req.log.verbose(logPrefix + 'Could not JSON parse incoming body. err: ' + err.message);

				return;
			}
		}

		cb();
	});
};

UserApi.prototype.start = function (cb) {
	const logPrefix = topLogPrefix + 'Api.prototype.start() - ';
	const that = this;

	if (!cb) cb = function () {};

	let intercom;

	if (that.options.intercom) {
		intercom = that.options.intercom;
	} else if (that.options.amqp && that.options.amqp.default) {
		intercom = new Intercom({
			conStr: that.options.amqp.default,
			log: that.options.log
		});
	}

	function getUserLibInstance() {
		return new Promise((resolve, reject) => {
			if (that.options.userLib) {
				resolve(that.options.userLib);

				return;
			}

			const userLib = new UserLib({
				db: that.options.db,
				log: that.options.log,
				intercom: intercom,
				mode: that.options.mode,
				amsyc: that.options.amsync
			}, function (err) {
				if (err) return reject(err);
				resolve(userLib);
			});
		});
	}

	getUserLibInstance()
		.then(userLib => {
			that.api.middleware.splice(1, 0, function (req, res, cb) {
				req.userLib = userLib;
				req.log = that.options.log;
				req.db = that.options.db;
				cb();
			});

			that.options.log.info(logPrefix + '===--- Larvituser-api starting ---===');
			that.api.start(cb);
		})
		.catch(err => {
			return cb(err);
		});
};

UserApi.prototype.stop = function (cb) {
	const that = this;

	that.api.stop(cb);
};

exports = module.exports = UserApi;
