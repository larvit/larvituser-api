'use strict';

const	topLogPrefix	= 'larvituser-api: ./index.js - ',
	userLib	= require('larvituser'),
	App	= require('larvitbase-api'),
	log	= require('winston');

function Api(options) {
	const	that	= this;

	that.options	= options;

	if ( ! that.options)	that.options	= {};

	that.app	= new App(that.options);
};

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

		that.app.start(cb);
	});;
};

Api.prototype.stop = function (cb) {
	const that = this;
	that.app.close(cb);
};

exports = module.exports = Api;
