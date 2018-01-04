'use strict';

const	topLogPrefix	= 'larvituser-api: ./index.js - ',
	userLib	= require('larvituser'),
	Api	= require('larvitbase-api'),
	log	= require('winston');

function UserApi(options) {
	const	logPrefix	= topLogPrefix + 'UserApi() - ',
		that	= this;

	that.options	= options;

	if ( ! that.options)	that.options	= {};

	that.api	= new Api(that.options);

	// Parse all incoming data as JSON
	that.api.middleware.splice(1, 0, function (req, res, cb) {
		if (req.rawBody) {
			try {
				req.jsonBody	= JSON.parse(req.rawBody.toString());
			} catch (err) {
				res.statusCode	= 400;
				res.end('"Bad Request\nProvided body is not a valid JSON string"');
				log.verbose(logPrefix + 'Could not JSON parse incoming body. err: ' + err.message);
				return;
			}
		}

		cb();
	});
};

UserApi.prototype.start = function (cb) {
	const	logPrefix	= topLogPrefix + 'Api.prototype.start() - ',
		that	= this;

	if ( ! cb) cb = function () {};

	if ( ! that.options.db) {
		const	err	= new Error('Db instance not present');
		log.warn(logPrefix + err.message);
		return cb(err);
	}

	userLib.dataWriter.intercom	= that.options.intercom;
	userLib.dataWriter.mode	= that.options.mode;
	userLib.options = {
		'amsync': that.options.amsync
	};

	log.info(logPrefix + '===--- Larvituser-api starting ---===');

	userLib.ready(function (err) {
		if (err) return cb(err);

		that.api.start(cb);
	});;
};

UserApi.prototype.stop = function (cb) {
	const that = this;
	that.api.stop(cb);
};

exports = module.exports = UserApi;
