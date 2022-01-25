'use strict';

const UserApi = require(__dirname + '/../index.js');
const fixture = require('./fixture');
const request = require('request');
const async = require('async');
const test = require('tape');

test('PUT roles rights', function (t) {
	const tasks = [];

	// Request API and check results against local database
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
		reqOptions.method = 'PUT';
		reqOptions.json = true;
		reqOptions.body = [];
		reqOptions.body.push({someRule: '^regexValue$'});

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode, 204);
			cb();
		});
	});

	// Check database for the role
	tasks.push(async function () {
		const sql = 'SELECT * FROM user_roles_rights WHERE role = \'someRule\'';

		const {rows} = await fixture.db.query(sql);
		t.equal(rows.length, 1);
		t.equal(rows[0].uri, '^regexValue$');
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PUT several rights', async function (t) {
	const tasks = [];

	// Empty database
	await fixture.db.query('DELETE FROM user_roles_rights');

	// Request API and check results against local database
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
		reqOptions.method = 'PUT';
		reqOptions.json = true;
		reqOptions.body = [];
		reqOptions.body.push({wepp: '^regexValue$'});
		reqOptions.body.push({wepp: '^dkdkdfos$'});
		reqOptions.body.push({boll: '^dess$'});

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode, 204);
			cb();
		});
	});

	// Check database for the role
	tasks.push(async function () {
		const sql = 'SELECT * FROM user_roles_rights';

		const {rows} = await fixture.db.query(sql);
		t.equal(rows.length, 3);
	});

	await async.series(tasks);
});

test('PUT invalid bodies', function (t) {
	const tasks = [];

	// Sending in a non-array
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
		reqOptions.method = 'PUT';
		reqOptions.json = true;
		reqOptions.body = {bolli: 'bompa'};

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode, 400);
			cb();
		});
	});

	// Sending in an array with invalid objects
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
		reqOptions.method = 'PUT';
		reqOptions.json = true;
		reqOptions.body = [{bolli: 'bompa', igen: 'hihi'}];

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode, 400);
			cb();
		});
	});

	// Sending in an array with invalid key
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
		reqOptions.method = 'PUT';
		reqOptions.json = true;
		reqOptions.body = [{'  ': 'bompa'}];

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode, 422);
			cb();
		});
	});

	// Sending in an array with invalid regex
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
		reqOptions.method = 'PUT';
		reqOptions.json = true;
		reqOptions.body = [{dde: ')'}];

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode, 422);
			cb();
		});
	});

	async.parallel(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('DELETE one role right', async function (t) {
	const tasks = [];

	// Empty database
	await fixture.db.query('DELETE FROM user_roles_rights');

	// Add a a few roles
	await fixture.db.query('INSERT INTO user_roles_rights VALUES(\'aaa\',\'^bu$\'),(\'aaa\',\'^leffe$\'),(\'bbb\',\'^skev$\')');

	// Run REST query
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
		reqOptions.method = 'DELETE';
		reqOptions.json = true;
		reqOptions.body = [];
		reqOptions.body.push({aaa: '^leffe$'});

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode, 204);
			cb();
		});
	});

	// Check database contents
	tasks.push(async function () {
		const {rows} = await fixture.db.query('SELECT * FROM user_roles_rights');
		t.equal(rows.length, 2);
		t.equal(rows[0].role, 'aaa');
		t.equal(rows[0].uri, '^bu$');
		t.equal(rows[1].role, 'bbb');
		t.equal(rows[1].uri, '^skev$');
	});

	await async.series(tasks);
});

test('DELETE two roles rights', async function (t) {
	const tasks = [];

	// Empty database
	await fixture.db.query('DELETE FROM user_roles_rights');

	// Add a a few roles
	await fixture.db.query('INSERT INTO user_roles_rights VALUES(\'aaa\',\'^bu$\'),(\'aaa\',\'^leffe$\'),(\'bbb\',\'^skev$\')');

	// Run REST query
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
		reqOptions.method = 'DELETE';
		reqOptions.json = true;
		reqOptions.body = [];
		reqOptions.body.push({aaa: '^leffe$'});
		reqOptions.body.push({bbb: '^skev$'});

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode, 204);

			cb();
		});
	});

	// Check database contents
	tasks.push(async function () {
		const {rows} = await fixture.db.query('SELECT * FROM user_roles_rights');

		t.equal(rows.length, 1);
		t.equal(rows[0].role, 'aaa');
		t.equal(rows[0].uri, '^bu$');
	});

	await async.series(tasks);
});

test('DELETE invalid bodies', function (t) {
	const tasks = [];

	// Sending in a non-array
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
		reqOptions.method = 'DELETE';
		reqOptions.json = true;
		reqOptions.body = {bolli: 'bompa'};

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode, 400);
			cb();
		});
	});

	// Sending in an array with invalid objects
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
		reqOptions.method = 'DELETE';
		reqOptions.json = true;
		reqOptions.body = [{bolli: 'bompa', igen: 'hihi'}];

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode, 400);
			cb();
		});
	});

	// Sending in an array with invalid key
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
		reqOptions.method = 'DELETE';
		reqOptions.json = true;
		reqOptions.body = [{'  ': 'bompa'}];

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode, 422);
			cb();
		});
	});

	async.parallel(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('GET roles rights', async function (t) {
	const tasks = [];

	// Empty database
	await fixture.db.query('DELETE FROM user_roles_rights');

	// Add a a few roles
	await fixture.db.query('INSERT INTO user_roles_rights VALUES(\'aaa\',\'^bu$\'),(\'aaa\',\'^leffe$\'),(\'bbb\',\'^skev$\')');

	// Run REST query
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
		reqOptions.method = 'GET';

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body, '[{"aaa":"^bu$"},{"aaa":"^leffe$"},{"bbb":"^skev$"}]');

			cb();
		});
	});

	await async.series(tasks);
});

test('Invalid method', function (t) {
	const reqOptions = {};

	reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/roles_rights';
	reqOptions.method = 'POST';
	reqOptions.body = { asdfa: 'asdfa' };
	reqOptions.json = true;

	request(reqOptions, function (err, response) {
		if (err) throw err;

		t.equal(response.statusCode, 405);
		t.end();
	});
});
