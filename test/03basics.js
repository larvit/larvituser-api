'use strict';

const	UserApi	= require(__dirname + '/../index.js'),
	request	= require('request'),
	async	= require('async'),
	test	= require('tape'),
	db	= require('larvitdb'),
	options = {
		'amqp': { 'default': 'loopback interface' },
		'amsync':	{},
		'log':	require(__dirname + '/../config/log_test.json'),
		'db':	db
	};

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
		request('http://localhost:' + userApi.api.lBase.httpServer.address().port, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);
			t.equal(body.length,	5603);
			cb();
		});
	});

	// Try 404 request
	tasks.push(function (cb) {
		request('http://localhost:' + userApi.api.lBase.httpServer.address().port + '/foo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	404);
			t.equal(body,	'"URL endpoint not found"');
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
