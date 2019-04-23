'use strict';

const	UserApi	= require(__dirname + '/../index.js');
const UserLib	= require('larvituser');
const request	= require('request');
const uuidv4	= require('uuid/v4');
const async	= require('async');
const test	= require('tape');

test('Create users to list', function (t) {
	const	tasks	= [];

	for (let i = 0; i < 3; i ++) {
		tasks.push(function (cb) {
			UserLib.instance.create('user-' + i, 'password-' + i, { 'firstName': 'Benkt-' + i, 'lastname': 'Usersson-' + i, 'code': i}, uuidv4(), cb);
		});
	}

	tasks.push(function (cb) {
		UserLib.instance.create('user-nisse', 'password-nisse', { 'firstName': 'Nissersson', 'lastname': 'Testsson', 'code': '0'}, uuidv4(), cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Only allow GET', function (t) {
	const	reqOptions	= {};

	reqOptions.url	= 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users';
	reqOptions.method	= 'POST';
	reqOptions.json	= true;
	reqOptions.body	= {};

	request(reqOptions, function (err, response, body) {
		if (err) return cb(err);

		t.equal(response.statusCode,	405);
		t.equal(body,	'Method not allowed');
		t.end();
	});
});

test('List users', function (t) {
	const	tasks	= [];

	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users';
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length,	4);
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get users based on uuid', function (t) {
	const	tasks	= [];

	let	users;

	tasks.push(function (cb) {
		new UserLib.Users({
			'log': UserLib.instance.options.log,
			'db': UserLib.instance.options.db
		}).get(function (err, result) {
			users	= result;
			cb(err);
		});
	});

	// Get one user
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?uuids=' + users[0].uuid;
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length,	1);
			t.equal(body[0].uuid,	users[0].uuid);
			cb();
		});
	});

	// Get two users
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?uuids=' + users[0].uuid + '&uuids=' + users[1].uuid;
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length,	2);
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get users with limit', function (t) {
	const	tasks	= [];

	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?limit=2';
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length,	2);
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

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?offset=2&limit=1';
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length,	1);
			t.equal(body[0].username,	'user-2');
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get users and fields', function (t) {
	const	tasks	= [];

	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?returnFields=firstName';
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length,	4);

			for (const user of body) {
				t.notEqual(user.firstName,	undefined);
				t.equal(user.firstName.length,	1);
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

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?q=Benkt-1';
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.length,	1);
			t.equal(body[0].username,	'user-1');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get users by query on single specific field', function (t) {
	const tasks = [];

	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?matchAllFieldsQ=lastname&matchAllFieldsQValues=ersson';
		reqOptions.method = 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.length, 3);
			t.ok(body.find((user) => user.username === 'user-0'));
			t.ok(body.find((user) => user.username === 'user-1'));
			t.ok(body.find((user) => user.username === 'user-2'));

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get users by query on multiple specific fields', function (t) {
	const tasks = [];

	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?matchAllFieldsQ=firstname&matchAllFieldsQValues=nisse&matchAllFieldsQ=code&matchAllFieldsQValues=0';
		reqOptions.method = 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.length, 1);
			t.ok(body.find((user) => user.username === 'user-nisse'));

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});
