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

test('Trying to start API without options', function (t) {
	const	userApi	= new UserApi();

	userApi.start(function (err) {
		t.equal(err instanceof Error,	true);
		t.equal(err.message,	'Db instance not present');
		t.end();
	});
});

test('Get a response from a controller', function (t) {
	const	tasks	= [];

	// Initialize api
	tasks.push(function (cb) {
		UserApi.instance	= new UserApi(options);
		UserApi.instance.start(cb);
	});

	// Try 200 request for Readme.md
	tasks.push(function (cb) {
		request('http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);
			t.equal(body.length,	5613);
			cb();
		});
	});

	// Try 404 request
	tasks.push(function (cb) {
		request('http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/foo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	404);
			t.equal(body,	'"URL endpoint not found"');
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Malformed request body', function (t) {
	const	reqOptions	= {};

	reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/user';
	reqOptions.method	= 'PUT';
	reqOptions.body	= '{"reven":"NEJ" and no closing thingie and also this text';

	request(reqOptions, function (err, response, body) {
		if (err) return cb(err);
		t.equal(response.statusCode,	400);
		t.equal(body,	'"Bad Request\nProvided body is not a valid JSON string"');
		t.end();
	});
});
