'use strict';

const	request	= require('request'),
	async	= require('async'),
	test	= require('tape'),
	UserApi	= require(__dirname + '/../index.js'),
	db	= require('larvitdb'),
	options = {
		'amqp': { 'default': 'loopback interface' },
		'amsync':	{},
		'log':	require(__dirname + '/../config/log_test.json'),
		'db':	require(__dirname + '/../config/db_test.json'),
		'server': { 'port': 9342, 'mode': 'master' }
	};

db.setup(options.db);

test('Check db', function (t) {
	db.query('SHOW TABLES', function (err, rows) {
		if (err) throw err;

		t.equals(rows.length, 0, 'SQL Database is not empty. To make a test, you must supply an empty database!');
		t.end();
	});
});

test('Get a response from a controller', function (t) {
	const	tasks	= [];

	let	userApi;

	// Initialize api
	tasks.push(function (cb) {
		userApi	= new UserApi(options);
		userApi.start(cb);
	});

	// Try 200 request for Readme.md
	tasks.push(function (cb) {
		request('http://localhost:' + options.server.port, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);
			t.equal(body.length,	5603);
			cb();
		});
	});

	// Try 404 request
	tasks.push(function (cb) {
		request('http://localhost:' + options.server.port + '/foo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	404);
			t.equal(body,	'Internal server error: deng');
			cb();
		});
	});

	// Close server
	tasks.push(function (cb) {
		userApi.stop(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Clean db', function (t) {
	db.removeAllTables(function (err) {
		if (err) throw err;
		t.end();
		process.exit(0);
	});
});