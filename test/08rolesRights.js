'use strict';

const	UserApi	= require(__dirname + '/../index.js'),
	request	= require('request'),
	async	= require('async'),
	test	= require('tape'),
	db	= require('larvitdb');

test('PUT roles rights', function (t) {
	const	tasks	= [];

	// Request API and check results against local database
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/roles_rights';
		reqOptions.method	= 'PUT';
		reqOptions.json	= true;
		reqOptions.body	= [];
		reqOptions.body.push({'someRule':	'^regexValue$'});

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode,	204);
			cb();
		});
	});

	// Check database for the role
	tasks.push(function (cb) {
		const	sql	= 'SELECT * FROM user_roles_rights WHERE role = \'someRule\'';

		db.query(sql, function (err, rows) {
			if (err) throw err;

			t.equal(rows.length,	1);
			t.equal(rows[0].uri,	'^regexValue$');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PUT several rights', function (t) {
	const	tasks	= [];

	// Empty database
	tasks.push(function (cb) {
		db.query('DELETE FROM user_roles_rights', cb);
	});

	// Request API and check results against local database
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/roles_rights';
		reqOptions.method	= 'PUT';
		reqOptions.json	= true;
		reqOptions.body	= [];
		reqOptions.body.push({'wepp':	'^regexValue$'});
		reqOptions.body.push({'wepp':	'^dkdkdfos$'});
		reqOptions.body.push({'boll':	'^dess$'});

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode,	204);
			cb();
		});
	});

	// Check database for the role
	tasks.push(function (cb) {
		const	sql	= 'SELECT * FROM user_roles_rights';

		db.query(sql, function (err, rows) {
			if (err) throw err;

			t.equal(rows.length,	3);

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('DELETE one role right', function (t) {
	const	tasks	= [];

	// Empty database
	tasks.push(function (cb) {
		db.query('DELETE FROM user_roles_rights', cb);
	});

	// Add a a few roles
	tasks.push(function (cb) {
		db.query('INSERT INTO user_roles_rights VALUES(\'aaa\',\'^bu$\'),(\'aaa\',\'^leffe$\'),(\'bbb\',\'^skev$\')', cb);
	});

	// Run REST query
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/roles_rights';
		reqOptions.method	= 'DELETE';
		reqOptions.json	= true;
		reqOptions.body	= [];
		reqOptions.body.push({'aaa':	'^leffe$'});

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode,	204);
			cb();
		});
	});

	// Check database contents
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_roles_rights', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	2);
			t.equal(rows[0].role,	'aaa');
			t.equal(rows[0].uri,	'^bu$');
			t.equal(rows[1].role,	'bbb');
			t.equal(rows[1].uri,	'^skev$');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('DELETE two roles rights', function (t) {
	const	tasks	= [];

	// Empty database
	tasks.push(function (cb) {
		db.query('DELETE FROM user_roles_rights', cb);
	});

	// Add a a few roles
	tasks.push(function (cb) {
		db.query('INSERT INTO user_roles_rights VALUES(\'aaa\',\'^bu$\'),(\'aaa\',\'^leffe$\'),(\'bbb\',\'^skev$\')', cb);
	});

	// Run REST query
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/roles_rights';
		reqOptions.method	= 'DELETE';
		reqOptions.json	= true;
		reqOptions.body	= [];
		reqOptions.body.push({'aaa':	'^leffe$'});
		reqOptions.body.push({'bbb':	'^skev$'});

		request(reqOptions, function (err, response) {
			if (err) return cb(err);

			t.equal(response.statusCode,	204);

			cb();
		});
	});

	// Check database contents
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_roles_rights', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	1);
			t.equal(rows[0].role,	'aaa');
			t.equal(rows[0].uri,	'^bu$');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('GET roles rights', function (t) {
	const	tasks	= [];

	// Empty database
	tasks.push(function (cb) {
		db.query('DELETE FROM user_roles_rights', cb);
	});

	// Add a a few roles
	tasks.push(function (cb) {
		db.query('INSERT INTO user_roles_rights VALUES(\'aaa\',\'^bu$\'),(\'aaa\',\'^leffe$\'),(\'bbb\',\'^skev$\')', cb);
	});

	// Run REST query
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/roles_rights';
		reqOptions.method	= 'GET';

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body,	'[{"aaa":"^bu$"},{"aaa":"^leffe$"},{"bbb":"^skev$"}]');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});
