'use strict';

const	topLogPrefix	= 'larvituser-api ./index.js - ',
	userLib	= require('larvituser'),
	Intercom	= require('larvitamintercom'),
	log	= require('winston'),
	db	= require('larvitdb');

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

	db.setup(that.options.db);

	userLib.dataWriter.intercom	= new Intercom(that.options.amqp.default || 'loopback interface');
	userLib.dataWriter.mode	= that.options.server.mode;
	userLib.dataWriter.options = {
		'amsync': that.options.amsync
	};

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
