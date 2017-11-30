'use strict';

const logPrefix	= 'larvituser-api ./Api.js - ',
	Intercom	= require('larvitamintercom'),
	userLib	= require('larvituser'),
	log	= require('winston'),
	db	= require('larvitdb');

function Api(options) {
	this.options = options;

	if ( ! this.options) this.options = {};
	if ( ! this.options.server) this.options.server = {};
	if ( ! this.options.server.beforeware) this.options.server.beforeware = [];
	if ( ! this.options.server.middleware) this.options.server.middleware = [];
	if ( ! this.options.server.afterware) this.options.server.afterware = [];
}

Api.prototype.start = function (cb) {
	const that = this;

	if ( ! cb) cb = function () {};

	if ( ! that.options.db) {
		const e = new Error('Db configuration not present');
		log.warn(logPrefix + e.message);
		return cb(e);
	}

	if ( ! that.options.server.port) {
		const e = new Error('Server port must be set');
		log.warn(logPrefix + e.message);
		return cb(e);
	}

	userLib.dataWriter.intercom	= that.options.intercom ? new Intercom(that.options.amqp) : undefined;

	db.setup(that.options.db);

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