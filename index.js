'use strict';

<<<<<<< HEAD
const logPrefix	= 'larvituser-api ./index.js - ',
	Intercom	= require('larvitamintercom'),
=======
const	topLogPrefix	= 'larvituser-api ./index.js - ',
>>>>>>> f2315be9d4072a6ecacc02f682aa89c919253f1c
	userLib	= require('larvituser'),
	log	= require('winston');

function Api(options) {
	this.options	= options;

	if ( ! this.options)	this.options	= {};
	if ( ! this.options.server)	this.options.server	= {};
	if ( ! this.options.server.customRoutes)	this.options.server.customRoutes	= [];
	if ( ! this.options.server.beforeware)	this.options.server.beforeware	= [];
	if ( ! this.options.server.middleware)	this.options.server.middleware	= [];
	if ( ! this.options.server.afterware)	this.options.server.afterware	= [];
}

Api.prototype.start = function (cb) {
	const	logPrefix	= topLogPrefix + 'Api.prototype.start() - ',
		that	= this;

	if ( ! cb) cb = function () {};

	if ( ! that.options.db) {
		const	err	= new Error('Db instance present');
		log.warn(logPrefix + err.message);
		return cb(err);
	}

	if ( ! that.options.server.port) {
		const	err	= new Error('Server port must be set');
		log.warn(logPrefix + err.message);
		return cb(err);
	}

	userLib.dataWriter.intercom	= that.options.intercom;
	userLib.dataWriter.mode	= that.options.mode;

	log.info(logPrefix + '===--- Larvituser-api starting ---===');

	userLib.ready(function (err) {
		if (err) throw err;
		require('larvitbase')(that.options.server).on('serverListening', function () {
			log.info(logPrefix + 'Api is up and running!');
			cb();
		});
	});;
};

exports = module.exports = Api;
