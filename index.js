'use strict';

const logPrefix	= 'larvituser-api ./index.js - ',
	Intercom	= require('larvitamintercom'),
	userLib	= require('larvituser'),
	log	= require('winston'),
	db	= require('larvitdb'),
	fs	= require('fs');

let options,
	intercom;

process.chdir(__dirname);

options = {
	'server': fs.existsSync(__dirname + '/config/server.json') ? require(__dirname + '/config/server.json') : JSON.parse(fs.readFileSync(__dirname + '/config/server.json_example', 'utf8')),
	'amqp':	fs.existsSync(__dirname + '/config/amqp.json') ? require(__dirname + '/config/amqp.json') : JSON.parse(fs.readFileSync(__dirname + '/config/amqp.json_example', 'utf8')),
	'log':	fs.existsSync(__dirname + '/config/log.json') ? require(__dirname + '/config/log.json') : JSON.parse(fs.readFileSync(__dirname + '/config/log.json_example', 'utf8')),
	'db':	fs.existsSync(__dirname + '/config/db.json') ? require(__dirname + '/config/db.json') : JSON.parse(fs.readFileSync(__dirname + '/config/db.json_example', 'utf8'))
};

// Add support for daily rotate file
log.transports.DailyRotateFile = require('winston-daily-rotate-file');

// Handle logging from config file
log.remove(log.transports.Console);
if (options.log !== undefined) {
	for (const logName of Object.keys(options.log)) {
		if (typeof options.log[logName] !== Array) {
			options.log[logName] = [options.log[logName]];
		}

		for (let i = 0; options.log[logName][i] !== undefined; i ++) {
			log.add(log.transports[logName], options.log[logName][i]);
		}
	}
}

log.info(logPrefix + '===--- Larvituser-api starting ---===');

userLib.dataWriter.mode	= options.server.mode;

// Intercom
intercom = new Intercom(options.amqp.default);
userLib.dataWriter.intercom	= intercom;

db.setup(options.db);

options.server.beforeware = [];
options.server.middleware = [];
options.server.afterware = [];

// Load routes
//options.server.customRoutes = require('../config/routes.json');

userLib.ready(function (err) {
	if (err) throw err;
	require('larvitbase')(options.server).on('serverListening', function () {
		log.info(logPrefix + 'Api is up and running!');
	});
});;