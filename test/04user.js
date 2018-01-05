'use strict';

const	UserApi	= require(__dirname + '/../index.js'),
	userLib	= require('larvituser'),
	request	= require('request'),
	uuidv1	= require('uuid/v1'),
	lUtils	=	require('larvitutils'),
	async	= require('async'),
	test	= require('tape'),
	db	= require('larvitdb');

test('PUT user, create new', function (t) {
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

test('PUT user, update user', function (t) {
	const	userUuid	= uuidv1(),
		tasks	= [];

	// Create user
	tasks.push(function (cb) {
		userLib.create('putUserUpdate', 'fomme', {'bing': 'bong'}, userUuid, cb);
	});

	// Run request
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/user';
		reqOptions.method	= 'PUT';
		reqOptions.body	= {};
		reqOptions.body.uuid	= userUuid;
		reqOptions.body.username	= 'putUserUpdate_updated';
		reqOptions.body.password	= 'bar';
		reqOptions.body.fields	= {};
		reqOptions.body.fields.flaff	= 'brånk';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);

			t.equal(body.username,	'putUserUpdate_updated');
			t.equal(body.uuid,	userUuid);
			t.equal(body.fields.flaff.length,	1);
			t.equal(body.fields.flaff[0],	'brånk');
			t.equal(Object.keys(body.fields).length,	1);

			cb();
		});
	});

	// Check data in database
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_users WHERE username = \'putUserUpdate_updated\'', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	1);
			t.equal(rows[0].username,	'putUserUpdate_updated');

			cb();
		});
	});

	tasks.push(function (cb) {
		let	sql	= '';

		sql += 'SELECT u.username, f.name AS fieldName, ud.data\n';
		sql += 'FROM user_users_data ud\n';
		sql += '	JOIN user_users u ON u.uuid = ud.userUuid\n';
		sql += '	JOIN user_data_fields f ON f.uuid = ud.fieldUuid\n';
		sql += 'WHERE u.username = ?\n';
		sql += 'ORDER BY ud.data';

		db.query(sql, ['putUserUpdate_updated'], function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	1);
			t.equal(rows[0].username,	'putUserUpdate_updated');
			t.equal(rows[0].fieldName,	'flaff');
			t.equal(rows[0].data,	'brånk');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('GET user', function (t) {
	const	userUuid	= uuidv1(),
		tasks	= [];

	// Create user
	tasks.push(function (cb) {
		userLib.create('getUser', 'stolle', {'baj': 'en'}, userUuid, cb);
	});

	// Get by uuid
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/user?uuid=' + userUuid;
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.username,	'getUser');
			t.equal(body.uuid,	userUuid);
			t.equal(body.fields.baj.length,	1);
			t.equal(body.fields.baj[0],	'en');
			t.equal(Object.keys(body.fields).length,	1);

			cb();
		});
	});

	// Get by username
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/user?username=getuser';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body.username,	'getUser');
			t.equal(body.uuid,	userUuid);
			t.equal(body.fields.baj.length,	1);
			t.equal(body.fields.baj[0],	'en');
			t.equal(Object.keys(body.fields).length,	1);

			cb();
		});
	});

	// 404 request for non existing user
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/user?uuid=' + uuidv1();
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	404);
			t.equal(body,	'Not Found');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PATCH user - fields', function (t) {
	const	userUuid	= uuidv1(),
		tasks	= [];

	// Create user
	tasks.push(function (cb) {
		userLib.create('patchUser', 'dkfalls', {'bing': 'bong', 'palt': 'koma'}, userUuid, cb);
	});

	// Run request
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/user';
		reqOptions.method	= 'PATCH';
		reqOptions.body	= {};
		reqOptions.body.uuid	= userUuid;
		reqOptions.body.fields	= {};
		reqOptions.body.fields.palt	= 'korv';
		reqOptions.body.fields.beff	= 'yes';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);

			t.equal(body.username,	'patchUser');
			t.equal(body.uuid,	userUuid);
			t.equal(body.fields.bing.length,	1);
			t.equal(body.fields.bing[0],	'bong');
			t.equal(body.fields.palt.length,	1);
			t.equal(body.fields.palt[0],	'korv');
			t.equal(body.fields.beff.length,	1);
			t.equal(body.fields.beff[0],	'yes');
			t.equal(Object.keys(body.fields).length,	3);

			cb();
		});
	});

	// Check data in database
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_users WHERE username = \'patchUser\'', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	1);
			t.equal(lUtils.formatUuid(rows[0].uuid),	userUuid);
			t.equal(rows[0].username,	'patchUser');

			cb();
		});
	});

	tasks.push(function (cb) {
		let	sql	= '';

		sql += 'SELECT u.username, f.name AS fieldName, ud.data\n';
		sql += 'FROM user_users_data ud\n';
		sql += '	JOIN user_users u ON u.uuid = ud.userUuid\n';
		sql += '	JOIN user_data_fields f ON f.uuid = ud.fieldUuid\n';
		sql += 'WHERE u.username = ?\n';
		sql += 'ORDER BY ud.data';

		db.query(sql, ['patchUser'], function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	3);
			t.equal(rows[0].username,	'patchUser');
			t.equal(rows[0].fieldName,	'bing');
			t.equal(rows[0].data,	'bong');
			t.equal(rows[1].fieldName,	'palt');
			t.equal(rows[1].data,	'korv');
			t.equal(rows[2].fieldName,	'beff');
			t.equal(rows[2].data,	'yes');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PATCH user - username', function (t) {
	const	userUuid	= uuidv1(),
		tasks	= [];

	// Create user
	tasks.push(function (cb) {
		userLib.create('patchUser_username', 'dkfalls', {'bing': 'bong', 'palt': 'koma'}, userUuid, cb);
	});

	// Run request
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/user';
		reqOptions.method	= 'PATCH';
		reqOptions.body	= {};
		reqOptions.body.uuid	= userUuid;
		reqOptions.body.username	= 'patchUser_username_updated';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);

			t.equal(body.username,	'patchUser_username_updated');
			t.equal(body.uuid,	userUuid);
			t.equal(body.fields.bing.length,	1);
			t.equal(body.fields.bing[0],	'bong');
			t.equal(body.fields.palt.length,	1);
			t.equal(body.fields.palt[0],	'koma');
			t.equal(Object.keys(body.fields).length,	2);

			cb();
		});
	});

	// Check data in database
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_users WHERE username = \'patchUser_username_updated\'', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	1);
			t.equal(lUtils.formatUuid(rows[0].uuid),	userUuid);

			cb();
		});
	});

	tasks.push(function (cb) {
		let	sql	= '';

		sql += 'SELECT u.username, f.name AS fieldName, ud.data\n';
		sql += 'FROM user_users_data ud\n';
		sql += '	JOIN user_users u ON u.uuid = ud.userUuid\n';
		sql += '	JOIN user_data_fields f ON f.uuid = ud.fieldUuid\n';
		sql += 'WHERE u.username = ?\n';
		sql += 'ORDER BY ud.data';

		db.query(sql, ['patchUser_username_updated'], function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	2);
			t.equal(rows[0].fieldName,	'bing');
			t.equal(rows[0].data,	'bong');
			t.equal(rows[1].fieldName,	'palt');
			t.equal(rows[1].data,	'koma');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PATCH user - username and fields', function (t) {
	const	userUuid	= uuidv1(),
		tasks	= [];

	// Create user
	tasks.push(function (cb) {
		userLib.create('patchUser_username_and_fields', 'dkfalls', {'bing': 'bong', 'palt': 'koma'}, userUuid, cb);
	});

	// Run request
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/user';
		reqOptions.method	= 'PATCH';
		reqOptions.body	= {};
		reqOptions.body.uuid	= userUuid;
		reqOptions.body.username	= 'patchUser_username_and_fields_updated';
		reqOptions.body.fields	= {};
		reqOptions.body.fields.palt	= 'korv';
		reqOptions.body.fields.beff	= 'yes';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);

			t.equal(body.username,	'patchUser_username_and_fields_updated');
			t.equal(body.uuid,	userUuid);
			t.equal(body.fields.bing.length,	1);
			t.equal(body.fields.bing[0],	'bong');
			t.equal(body.fields.palt.length,	1);
			t.equal(body.fields.palt[0],	'korv');
			t.equal(body.fields.beff.length,	1);
			t.equal(body.fields.beff[0],	'yes');
			t.equal(Object.keys(body.fields).length,	3);

			cb();
		});
	});

	// Check data in database
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_users WHERE username = \'patchUser_username_and_fields_updated\'', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	1);
			t.equal(lUtils.formatUuid(rows[0].uuid),	userUuid);

			cb();
		});
	});

	tasks.push(function (cb) {
		let	sql	= '';

		sql += 'SELECT u.username, f.name AS fieldName, ud.data\n';
		sql += 'FROM user_users_data ud\n';
		sql += '	JOIN user_users u ON u.uuid = ud.userUuid\n';
		sql += '	JOIN user_data_fields f ON f.uuid = ud.fieldUuid\n';
		sql += 'WHERE u.username = ?\n';
		sql += 'ORDER BY ud.data';

		db.query(sql, ['patchUser_username_and_fields_updated'], function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	3);
			t.equal(rows[0].username,	'patchUser_username_and_fields_updated');
			t.equal(rows[0].fieldName,	'bing');
			t.equal(rows[0].data,	'bong');
			t.equal(rows[1].fieldName,	'palt');
			t.equal(rows[1].data,	'korv');
			t.equal(rows[2].fieldName,	'beff');
			t.equal(rows[2].data,	'yes');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('DELETE user', function (t) {
	const	userUuid	= uuidv1(),
		tasks	= [];

	// Create user
	tasks.push(function (cb) {
		userLib.create('deleteUser', 'stolle', {'weng': 'wong'}, userUuid, cb);
	});

	// Delete
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/user';
		reqOptions.method	= 'DELETE';
		reqOptions.body	= {};
		reqOptions.body.uuid	= userUuid;
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode,	200);
			t.equal(body,	'acknowledged');

			cb();
		});
	});

	// Check database
	tasks.push(function (cb) {
		db.query('SELECT uuid FROM user_users WHERE username = ?', 'deleteUser', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length,	0);
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
