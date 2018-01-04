'use strict';

const	UserApi	= require(__dirname + '/../index.js'),
	request	= require('request'),
	lUtils	=	require('larvitutils'),
	async	= require('async'),
	test	= require('tape'),
	db	= require('larvitdb');

test('PUT user', function (t) {
	const	tasks	= [];

	// Run request
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/user';
		reqOptions.method	= 'PUT';
		reqOptions.body	= {};
		reqOptions.body.username	= 'foo';
		reqOptions.body.password	= 'bar';
		reqOptions.body.fields	= {};
		reqOptions.body.fields.firstName	= 'Bosse';
		reqOptions.body.fields.lastName	= 'Bengtsson';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);

			t.equal(body.username,	'foo');
			t.equal(lUtils.formatUuid(body.uuid).length,	36);
			t.equal(body.fields.firstName[0],	'Bosse');
			t.equal(body.fields.lastName[0],	'Bengtsson');

			cb();
		});
	});

	// Check data in database
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_users', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	1);
			t.equal(rows[0].username,	'foo');

			cb();
		});
	});

	tasks.push(function (cb) {
		let	sql	= '';

		sql += 'SELECT u.username, f.name AS fieldName, ud.data\n';
		sql += 'FROM user_users_data ud\n';
		sql += '	JOIN user_users u ON u.uuid = ud.userUuid\n';
		sql += '	JOIN user_data_fields f ON f.uuid = ud.fieldUuid\n';
		sql += 'ORDER BY ud.data';

		db.query(sql, function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	2);
			t.equal(rows[0].username,	'foo');
			t.equal(rows[0].fieldName,	'lastName');
			t.equal(rows[0].data,	'Bengtsson');
			t.equal(rows[1].username,	'foo');
			t.equal(rows[1].fieldName,	'firstName');
			t.equal(rows[1].data,	'Bosse');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Clear users and users data', function (t) {
	db.query('DELETE FROM user_users_data', function (err) {
		if (err) throw err;
		db.query('DELETE FROM user_users', function (err) {
			if (err) throw err;
			t.end();
		});
	});
});
