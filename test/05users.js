'use strict';

const	UserApi	= require(__dirname + '/../index.js'),
	userLib	= require('larvituser'),
	request	= require('request'),
	uuidv4	= require('uuid/v4'),
	async	= require('async'),
	test	= require('tape');

test('Create users to list', function (t) {
	const tasks = [];

	for (let i = 0; i < 3; i ++) {
		tasks.push(function (cb) {
			userLib.create('user-' + i, 'password-' + i, { 'firstname': 'Benkt-' + i, 'lastname': 'Usersson-' + i}, uuidv4(), cb);
		});
	}

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Only allow GET', function (t) {
	const reqOptions = {};
	reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/users';
	reqOptions.method	= 'POST';
	reqOptions.json	= true;

	request(reqOptions, function (err, response, body) {
		if (err) return cb(err);

		t.equal(response.statusCode,	405);
		t.equal(body, 'Method not allowed');
		t.end();
	});
});

test('List users', function (t) {
	const	tasks	= [];


	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/users';
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length, 3);
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get users based on uuid', function (t) {
	const tasks = [];

	let users;

	tasks.push(function (cb) {
		new userLib.Users().get(function (err, result) {
			users = result;
			cb(err);
		});
	});

	// get one user
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/users?uuids=' + users[0].uuid;
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length, 1);
			t.equal(body[0].uuid, users[0].uuid);
			cb();
		});
	});

	// get two users
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/users?uuids=' + users[0].uuid + '&uuids=' + users[1].uuid;
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length, 2);
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get users with limit', function (t) {
	const tasks = [];

	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/users?limit=2';
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length, 2);
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get users with offset', function (t) {
	const tasks = [];

	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/users?offset=2&limit=1';
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length, 1);
			t.equal(body[0].username, 'user-2');
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get users and fields', function (t) {
	const tasks = [];

	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/users?returnFields=firstname';
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length, 3);

			for (const user of body) {
				t.notEqual(user.firstname, undefined);
				t.equal(user.firstname.length, 1);
			}

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get users by query', function (t) {
	const tasks = [];

	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/users?q=Benkt-1';
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length, 1);
			t.equal(body[0].username, 'user-1');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});