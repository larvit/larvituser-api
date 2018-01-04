'use strict';

const	UserApi	= require(__dirname + '/../index.js'),
	userLib	= require('larvituser'),
	request	= require('request'),
	uuidv4	= require('uuid/v4'),
	async	= require('async'),
	test	= require('tape');


test('Create user to login with', function (t) {
	const tasks = [];

	tasks.push(function (cb) {
		userLib.create('user-login', 'skärböna', { 'firstname': 'Svempa', 'lastname': 'Svampsson'}, uuidv4(), cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Successful login', function (t) {
	const	tasks	= [];

	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/login';
		reqOptions.method	= 'POST';
		reqOptions.json	= true;
		reqOptions.body	= {
			'username': 'user-login',
			'password': 'skärböna'
		};

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.username, 'user-login');
			t.equal(body.fields.firstname[0], 'Svempa');
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Failed login', function (t) {
	const	tasks	= [];

	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/login';
		reqOptions.method	= 'POST';
		reqOptions.json	= true;
		reqOptions.body	= {
			'username': 'user-login',
			'password': 'fel lösenord'
		};

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body, false);
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Malformed body', function (t) {
	const	tasks	= [];

	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/login';
		reqOptions.method	= 'POST';
		reqOptions.json	= true;
		reqOptions.body	= {
			'sdf': 'user-login',
			'password': 'fel lösenord'
		};

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	400);
			t.equal(body, '400 Malformed request body');
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Unallowed method', function (t) {
	const	tasks	= [];

	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/login';
		reqOptions.method	= 'PUT';
		reqOptions.json	= true;
		reqOptions.body	= {
			'username': 'user-login',
			'password': 'skärböna'
		};

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	405);
			t.equal(body, '405 Method Not Allowed\nAllowed methods: POST');
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});