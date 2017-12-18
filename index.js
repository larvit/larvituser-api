'use strict';

const	topLogPrefix	= 'larvituser-api: ./index.js - ',
	userLib	= require('larvituser'),
	Router	= require('larvitrouter'),
	App	= require('larvitbase'),
	log	= require('winston');

function Api(options) {
	this.options	= options;

	if ( ! this.options)	this.options	= {};
	if ( ! this.options.appOptions)	this.options.appOptions	= {};
	this.router	= new Router();
}

Api.prototype.start = function (cb) {
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

		if ( ! Array.isArray(that.options.appOptions.middleware)) {
			that.options.appOptions.middleware	= [];
		}

		// Default to the latest version of the API
		that.options.appOptions.middleware.push(function (req, res, cb) {
			if ( ! req.url.match(/^\/v[0-9]\.[0-9]\//)) {
				req.url	= '/v0.1' + req.url;
			}
			cb();
		});

		that.options.appOptions.middleware.push(function (req, res, cb) {
			that.router.resolve(req.url, function (err, result) {
				req.routed	= result;
				cb(err);
			});
		});

		that.options.appOptions.middleware.push(function (req, res, cb) {
			if ( ! req.routed.controllerFullPath) {
				res.statusCode	= 404;
				res.data	= 'URL endpoint not found';
			} else {
				require(req.routed.controllerFullPath)(req, res, cb);
			}
		});

		that.options.appOptions.middleware.push(function (req, res, cb) {
			res.setHeader('Content-Type', 'application/json');
			res.end(res.data);
			cb();
		});

		that.app = new App(that.options.appOptions, function (err) {
			if (err) return cb(err);
			log.info(logPrefix + 'API is up and running!');
			cb();
		});

		that.app.on('error', function (err, req, res) {
			res.statusCode = 500;
			res.end('Internal server error: ' + err.message);
		});
	});;
};

exports = module.exports = Api;
