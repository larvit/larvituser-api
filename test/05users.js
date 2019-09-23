'use strict';

const UserApi = require(__dirname + '/../index.js');
const UserLib = require('larvituser');
const request = require('request');
const uuidv4 = require('uuid/v4');
const async = require('async');
const test = require('tape');

test('Create users to list', function (t) {
	const tasks = [];

	for (let i = 0; i < 3; i++) {
		tasks.push(function (cb) {
			UserLib.instance.create('user-' + i, 'password-' + i, { firstName: 'Benkt-' + i, lastname: 'Usersson-' + i, code: i}, uuidv4(), cb);
		});
	}

	tasks.push(function (cb) {
		UserLib.instance.create('user-nisse', 'password-nisse', { firstName: 'Nissersson', lastname: 'Testsson', code: '0'}, uuidv4(), cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Only allow GET', function (t) {
	const reqOptions = {};

	reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users';
	reqOptions.method = 'POST';
	reqOptions.json = true;
	reqOptions.body = {};

	request(reqOptions, function (err, response, body) {
		if (err) return cb(err);

		t.equal(response.statusCode, 405);
		t.equal(body, 'Method not allowed');
		t.end();
	});
});

test('List users', function (t) {
	const tasks = [];

	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users';
		reqOptions.method = 'GET';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.result.length, 4);
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
		new UserLib.Users({
			log: UserLib.instance.options.log,
			db: UserLib.instance.options.db
		}).get(function (err, result) {
			users = result;
			cb(err);
		});
	});

	// Get one user
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users';
		reqOptions.method = 'GET';
		reqOptions.json = true;
		reqOptions.qs = {
			uuids: users[0].uuid
		};

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.result.length, 1);
			t.equal(body.result[0].uuid, users[0].uuid);
			cb();
		});
	});

	// Get two users
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users';
		reqOptions.method = 'GET';
		reqOptions.json = true;
		reqOptions.qs = {
			uuids: users[0].uuid + ',' + users[1].uuid
		};

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.result.length, 2);
			t.ok(body.result.find(user => user.uuid === users[0].uuid));
			t.ok(body.result.find(user => user.uuid === users[1].uuid));
			cb();
		});
	});

	// Get two users using multiple query parameters
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + `/users?uuids=${users[0].uuid}&uuids=${users[1].uuid}`;
		reqOptions.method = 'GET';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.result.length, 2);
			t.ok(body.result.find(user => user.uuid === users[0].uuid));
			t.ok(body.result.find(user => user.uuid === users[1].uuid));
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
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?limit=2';
		reqOptions.method = 'GET';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.result.length, 2);
			t.equal(body.totalElements, 4);
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
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?offset=2&limit=1';
		reqOptions.method = 'GET';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.result.length, 1);
			t.equal(body.result[0].username, 'user-2');
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
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users';
		reqOptions.method = 'GET';
		reqOptions.json = true;
		reqOptions.qs = {
			returnFields: 'firstName'
		};

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.result.length, 4);

			for (const user of body.result) {
				t.notEqual(user.firstName, undefined);
				t.equal(user.firstName.length, 1);
			}

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get users and several fields using comma separated list', function (t) {
	const tasks = [];

	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users';
		reqOptions.method = 'GET';
		reqOptions.json = true;
		reqOptions.qs = {
			returnFields: 'firstName,lastName'
		};

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.result.length, 4);
			t.ok(body.result.find(user => String(user.firstName) === 'Benkt-0'));
			t.ok(body.result.find(user => String(user.firstName) === 'Benkt-1'));
			t.ok(body.result.find(user => String(user.firstName) === 'Benkt-2'));
			t.ok(body.result.find(user => String(user.firstName) === 'Nissersson'));
			t.ok(body.result.find(user => String(user.lastName) === 'Usersson-0'));
			t.ok(body.result.find(user => String(user.lastName) === 'Usersson-1'));
			t.ok(body.result.find(user => String(user.lastName) === 'Usersson-2'));
			t.ok(body.result.find(user => String(user.lastName) === 'Testsson'));

			for (const user of body.result) {
				t.notEqual(user.firstName, undefined);
				t.equal(user.firstName.length, 1);
				t.notEqual(user.lastName, undefined);
				t.equal(user.lastName.length, 1);
			}

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get users and several fields using multiple query parameters', function (t) {
	const tasks = [];

	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?returnFields=firstName&returnFields=lastName';
		reqOptions.method = 'GET';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.result.length, 4);
			t.ok(body.result.find(user => String(user.firstName) === 'Benkt-0'));
			t.ok(body.result.find(user => String(user.firstName) === 'Benkt-1'));
			t.ok(body.result.find(user => String(user.firstName) === 'Benkt-2'));
			t.ok(body.result.find(user => String(user.firstName) === 'Nissersson'));
			t.ok(body.result.find(user => String(user.lastName) === 'Usersson-0'));
			t.ok(body.result.find(user => String(user.lastName) === 'Usersson-1'));
			t.ok(body.result.find(user => String(user.lastName) === 'Usersson-2'));
			t.ok(body.result.find(user => String(user.lastName) === 'Testsson'));

			for (const user of body.result) {
				t.notEqual(user.firstName, undefined);
				t.equal(user.firstName.length, 1);
				t.notEqual(user.lastName, undefined);
				t.equal(user.lastName.length, 1);
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
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?q=Benkt-1';
		reqOptions.method = 'GET';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.result.length, 1);
			t.equal(body.result[0].username, 'user-1');

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
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.result.length, 3);
			t.ok(body.result.find((user) => user.username === 'user-0'));
			t.ok(body.result.find((user) => user.username === 'user-1'));
			t.ok(body.result.find((user) => user.username === 'user-2'));

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
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.result.length, 1);
			t.ok(body.result.find((user) => user.username === 'user-nisse'));

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});


test('Get users ordered by username ', function (t) {
	const tasks = [];

	// Ascending order
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?orderBy=username&orderDirection=asc';
		reqOptions.method = 'GET';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.totalElements, 4);
			t.equal(body.result[0].username, 'user-0');
			cb();
		});
	});

	// Descending order
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?orderBy=username&orderDirection=desc';
		reqOptions.method = 'GET';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.totalElements, 4);
			t.equal(body.result[0].username, 'user-nisse');
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});


test('Get users ordered by a field value', function (t) {
	const tasks = [];

	// Get users and order ascending by firstname
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?orderBy=firstName&orderDirection=asc&returnFields=firstName';
		reqOptions.method = 'GET';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.totalElements, 4);
			t.equal(body.result[0].username, 'user-0');
			t.equal(body.result[0].firstName[0], 'Benkt-0');

			cb();
		});
	});

	// Get users and order descending by firstname
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/users?orderBy=firstName&orderDirection=desc&returnFields=firstName';
		reqOptions.method = 'GET';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.totalElements, 4);
			t.equal(body.result[0].username, 'user-nisse');
			t.equal(body.result[0].firstName[0], 'Nissersson');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;

		t.end();
	});
});
