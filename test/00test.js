'use strict';

const	request	= require('request'),
	assert	= require('assert'),
	async	= require('async'),
	Api	= require(__dirname + '/../Api.js'),
	log	= require('winston'),
	db	= require('larvitdb'),
	fs	= require('fs');

let api;

// Set up winston
log.remove(log.transports.Console);
/**/log.add(log.transports.Console, {
	'level':	'warn',
	'colorize':	true,
	'timestamp':	true,
	'json':	false
}); /**/

before(function (done) {
	this.timeout(10000);
	const	tasks	= [];

	// Run DB Setup
	tasks.push(function (cb) {
		let confFile;

		if (process.env.DBCONFFILE === undefined) {
			confFile = __dirname + '/../config/db_test.json';
		} else {
			confFile = process.env.DBCONFFILE;
		}

		log.verbose('DB config file: "' + confFile + '"');

		// First look for absolute path
		fs.stat(confFile, function (err) {
			if (err) {

				// Then look for this string in the config folder
				confFile = __dirname + '/../config/' + confFile;
				fs.stat(confFile, function (err) {
					if (err) throw err;
					log.verbose('DB config: ' + JSON.stringify(require(confFile)));
					db.setup(require(confFile), cb);
				});

				return;
			}

			log.verbose('DB config: ' + JSON.stringify(require(confFile)));
			db.setup(require(confFile), cb);
		});
	});

	// Check for empty db
	tasks.push(function (cb) {
		db.query('SHOW TABLES', function (err, rows) {
			if (err) throw err;

			if (rows.length) {
				throw new Error('SQL Database is not empty. To make a test, you must supply an empty database!');
			}

			cb();
		});
	});

	// start the api
	tasks.push(function (cb) {
		const options = {
			'amsync':	{},
			'server':	require(__dirname + '/../config/server_test.json'),
			'amqp':	require(__dirname + '/../config/amqp_test.json'),
			'log':	{},
			'db':	require(__dirname + '/../config/db_test.json')
		};

		api = new Api(options);
		api.start(cb);
	});

	async.series(tasks, done);
});

describe('api test', function () {
	it('sanity check', function (done) {
		request('http://localhost:' + api.options.server.port, function (err, response, body) {
			if (err) throw err;
			assert.strictEqual(response.statusCode, 200);
			assert.strictEqual(body.indexOf('<h1>Welcome to larvituser-api</h1>') !== - 1, true);
			done();
		});
	});
});

after(function (done) {
	db.removeAllTables(done);
});
