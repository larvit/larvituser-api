'use strict';

const topLogPrefix = 'larvituser-api: ' + __filename + ' - ';
const {UserLib} = require('larvituser');
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

UserApi.prototype.start = async function (cb) {
	const logPrefix = topLogPrefix + 'Api.prototype.start() - ';
	const that = this;

	if (!cb) cb = function () {};

	function getUserLibInstance() {
		if (that.options.userLib) {
			return that.options.userLib;
		}

		const userLib = new UserLib({
			db: that.options.db,
			log: that.options.log
		});

		return userLib;
	}

	try {
		const userLib = getUserLibInstance();
		await userLib.runDbMigrations();

		that.api.middleware.splice(1, 0, function (req, res, cb) {
			req.userLib = userLib;
			req.log = that.options.log;
			req.db = that.options.db;
			cb();
		});
	} catch (err) {
		return cb(err);
	}

	that.options.log.info(logPrefix + '===--- Larvituser-api starting ---===');
	that.api.start(cb);
};

UserApi.prototype.stop = function (cb) {
	const that = this;

	that.api.stop(cb);
};

exports = module.exports = UserApi;
