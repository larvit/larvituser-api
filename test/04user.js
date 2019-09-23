'use strict';

const UserApi = require(__dirname + '/../index.js');
const UserLib = require('larvituser');
const request = require('request');
const uuidv1 = require('uuid/v1');
const lUtils = new (require('larvitutils').Utils)();
const async = require('async');
const test = require('tape');
const db = require('larvitdb');

test('Invalid method', function (t) {
	const reqOptions = {};

	reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
	reqOptions.method = 'POST';
	reqOptions.body = {};
	reqOptions.json = true;

	request(reqOptions, function (err, response, body) {
		if (err) throw err;

		t.equal(response.statusCode, 405);
		t.equal(body, 'Method Not Allowed\nAllowed method(s): GET, PUT, PATCH, DELETE');

		t.end();
	});
});

test('PUT user, malformed statements', function (t) {
	const tasks = [];

	// Malformed request, no username provided
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PUT';
		reqOptions.body = {};
		reqOptions.body.uuid = uuidv1();
		reqOptions.body.password = 'baj';
		reqOptions.body.fields = {};
		reqOptions.body.fields.flaff = 'brånk';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 400);
			t.equal(body, 'Bad Request\nNo username provided');

			cb();
		});
	});

	// Malformed request, username to long
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PUT';
		reqOptions.body = {};
		reqOptions.body.uuid = uuidv1();
		reqOptions.body.username = 'jöasldigjapoisjvpaewjrfp90q8jwfp+9q8w3jefpurjfop9ewurnpq8rjgpq3w98rvjpwe98rjgpwe98rgjpwae98rjgpa8rdjgpa9sdfjgpas98rjgpa8rjg9se8rjg98awejr9834jmf9328m4f9rf908sewrjf089wqjef09q324jkf0834jfg089serjg9aewkfiqwepfkasklpdlfdöböhösögwskgweoo0ewrplawkofijasegiqew90ru8uru98r9igkjwaeifjasoijdfjioasijfadef€£$]]€£}€}£$@££ððđ““ŋ“đđŋ”””';
		reqOptions.body.password = 'baj';
		reqOptions.body.fields = {};
		reqOptions.body.fields.flaff = 'brånk';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 422);
			t.equal(body, 'Unprocessable Entity\nUsername to long; maximum 191 UTF-8 characters allowed');

			cb();
		});
	});

	// Malformed request, invalid uuid
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PUT';
		reqOptions.body = {};
		reqOptions.body.uuid = 'blurgh';
		reqOptions.body.username = 'xxx';
		reqOptions.body.password = 'baj';
		reqOptions.body.fields = {};
		reqOptions.body.fields.flaff = 'brånk';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 400);
			t.equal(body, 'Bad Request\nProvided uuid has an invalid format');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PUT user, create new', function (t) {
	const tasks = [];

	// Run request
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PUT';
		reqOptions.body = {};
		reqOptions.body.username = 'foo';
		reqOptions.body.password = 'bar';
		reqOptions.body.fields = {};
		reqOptions.body.fields.firstName = 'Bosse';
		reqOptions.body.fields.lastName = 'Bengtsson';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body.username, 'foo');
			t.equal(lUtils.formatUuid(body.uuid).length, 36);
			t.equal(body.fields.firstName[0], 'Bosse');
			t.equal(body.fields.lastName[0], 'Bengtsson');

			cb();
		});
	});

	// Check data in database
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_users', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length, 1);
			t.equal(rows[0].username, 'foo');

			cb();
		});
	});

	tasks.push(function (cb) {
		let sql = '';

		sql += 'SELECT u.username, f.name AS fieldName, ud.data\n';
		sql += 'FROM user_users_data ud\n';
		sql += ' JOIN user_users u ON u.uuid = ud.userUuid\n';
		sql += ' JOIN user_data_fields f ON f.uuid = ud.fieldUuid\n';
		sql += 'ORDER BY ud.data';

		db.query(sql, function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length, 2);
			t.equal(rows[0].username, 'foo');
			t.equal(rows[0].fieldName, 'lastName');
			t.equal(rows[0].data, 'Bengtsson');
			t.equal(rows[1].username, 'foo');
			t.equal(rows[1].fieldName, 'firstName');
			t.equal(rows[1].data, 'Bosse');

			cb();
		});
	});

	// Try to create a new user with conflicting username
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PUT';
		reqOptions.body = {};
		reqOptions.body.username = 'foo';
		reqOptions.body.password = 'bar';
		reqOptions.body.fields = {};
		reqOptions.body.fields.firstName = 'Bosse';
		reqOptions.body.fields.lastName = 'Bengtsson';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 422);
			t.equal(body, 'Unprocessable Entity\nUsername is taken by another user');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PUT user, update user', function (t) {
	const userUuid = uuidv1();


	const tasks = [];

	// Create user
	tasks.push(function (cb) {
		UserLib.instance.create('putUserUpdate', 'fomme', {bing: 'bong'}, userUuid, cb);
	});

	// Run request
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PUT';
		reqOptions.body = {};
		reqOptions.body.uuid = userUuid;
		reqOptions.body.username = 'putUserUpdate_updated';
		reqOptions.body.password = 'bar';
		reqOptions.body.fields = {};
		reqOptions.body.fields.flaff = 'brånk';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.username, 'putUserUpdate_updated');
			t.equal(body.uuid, userUuid);
			t.equal(body.fields.flaff.length, 1);
			t.equal(body.fields.flaff[0], 'brånk');
			t.equal(Object.keys(body.fields).length, 1);

			cb();
		});
	});

	// Check data in database
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_users WHERE username = \'putUserUpdate_updated\'', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length, 1);
			t.equal(rows[0].username, 'putUserUpdate_updated');

			cb();
		});
	});

	tasks.push(function (cb) {
		let sql = '';

		sql += 'SELECT u.username, f.name AS fieldName, ud.data\n';
		sql += 'FROM user_users_data ud\n';
		sql += ' JOIN user_users u ON u.uuid = ud.userUuid\n';
		sql += ' JOIN user_data_fields f ON f.uuid = ud.fieldUuid\n';
		sql += 'WHERE u.username = ?\n';
		sql += 'ORDER BY ud.data';

		db.query(sql, ['putUserUpdate_updated'], function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length, 1);
			t.equal(rows[0].username, 'putUserUpdate_updated');
			t.equal(rows[0].fieldName, 'flaff');
			t.equal(rows[0].data, 'brånk');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PUT user, update user but not username', function (t) {
	const userUuid = uuidv1();


	const tasks = [];

	// Create user
	tasks.push(function (cb) {
		UserLib.instance.create('putUserUpdate_notUsername', 'fomme', {bing: 'bong'}, userUuid, cb);
	});

	// Run request
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PUT';
		reqOptions.body = {};
		reqOptions.body.uuid = userUuid;
		reqOptions.body.username = 'putUserUpdate_notUsername';
		reqOptions.body.password = 'bar';
		reqOptions.body.fields = {};
		reqOptions.body.fields.flaff = 'brånk';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.username, 'putUserUpdate_notUsername');
			t.equal(body.uuid, userUuid);
			t.equal(body.fields.flaff.length, 1);
			t.equal(body.fields.flaff[0], 'brånk');
			t.equal(Object.keys(body.fields).length, 1);

			cb();
		});
	});

	// Check data in database
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_users WHERE username = \'putUserUpdate_notUsername\'', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length, 1);
			t.equal(lUtils.formatUuid(rows[0].uuid), userUuid);

			cb();
		});
	});

	tasks.push(function (cb) {
		let sql = '';

		sql += 'SELECT u.username, f.name AS fieldName, ud.data\n';
		sql += 'FROM user_users_data ud\n';
		sql += ' JOIN user_users u ON u.uuid = ud.userUuid\n';
		sql += ' JOIN user_data_fields f ON f.uuid = ud.fieldUuid\n';
		sql += 'WHERE u.username = ?\n';
		sql += 'ORDER BY ud.data';

		db.query(sql, ['putUserUpdate_notUsername'], function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length, 1);
			t.equal(rows[0].username, 'putUserUpdate_notUsername');
			t.equal(rows[0].fieldName, 'flaff');
			t.equal(rows[0].data, 'brånk');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PUT without body', function (t) {
	const reqOptions = {};

	reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
	reqOptions.method = 'PUT';
	reqOptions.json = true;

	request(reqOptions, function (err, response) {
		if (err) return cb(err);

		t.equal(response.statusCode, 400);
		t.end();
	});
});

test('GET user, malformed statements', function (t) {
	const tasks = [];

	// Get by both uuid and username
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user?uuid=' + uuidv1() + '&username=blurre';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 400);
			t.equal(body, 'Bad Request\nOnly one of uuid and username is allowed at every single request');

			cb();
		});
	});

	// Get with no uuid or username
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 400);
			t.equal(body, 'Bad Request\nURL parameters uuid or username is required');

			cb();
		});
	});

	// Get with invalid uuid
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user?uuid=bleh';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 400);
			t.equal(body, 'Bad Request\nProvided uuid has an invalid format');

			cb();
		});
	});

	// Get user that does not exist
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user?uuid=' + uuidv1();
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 404);
			t.equal(body, 'Not Found');

			cb();
		});
	});

	async.parallel(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('GET user', function (t) {
	const userUuid = uuidv1();


	const tasks = [];

	// Create user
	tasks.push(function (cb) {
		UserLib.instance.create('getUser', 'stolle', {baj: 'en'}, userUuid, cb);
	});

	// Get by uuid
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user?uuid=' + userUuid;
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.username, 'getUser');
			t.equal(body.uuid, userUuid);
			t.equal(body.fields.baj.length, 1);
			t.equal(body.fields.baj[0], 'en');
			t.equal(Object.keys(body.fields).length, 1);

			cb();
		});
	});

	// Get by username
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user?username=getuser';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body.username, 'getUser');
			t.equal(body.uuid, userUuid);
			t.equal(body.fields.baj.length, 1);
			t.equal(body.fields.baj[0], 'en');
			t.equal(Object.keys(body.fields).length, 1);

			cb();
		});
	});

	// 404 request for non existing user by uuid
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user?uuid=' + uuidv1();
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 404);
			t.equal(body, 'Not Found');

			cb();
		});
	});

	// 404 request for non existing user by username
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user?username=' + uuidv1();
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 404);
			t.equal(body, 'Not Found');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PATCH user, malformed statements', function (t) {
	const tasks = [];

	// Missing uuid
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PATCH';
		reqOptions.body = {};
		reqOptions.body.fields = {};
		reqOptions.body.fields.palt = 'korv';
		reqOptions.body.fields.beff = 'yes';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 400);
			t.equal(body, 'Bad Request\nProvided uuid has an invalid format');

			cb();
		});
	});

	// Empty username
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PATCH';
		reqOptions.body = {};
		reqOptions.body.uuid = uuidv1();
		reqOptions.body.username = '  ';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 422);
			t.equal(body, 'Unprocessable Entity\nUsername must contain at least one non-space character');

			cb();
		});
	});

	// Username to long
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PATCH';
		reqOptions.body = {};
		reqOptions.body.uuid = uuidv1();
		reqOptions.body.username = 'jöasldigjapoisjvpaewjrfp90q8jwfp+9q8w3jefpurjfop9ewurnpq8rjgpq3w98rvjpwe98rjgpwe98rgjpwae98rjgpa8rdjgpa9sdfjgpas98rjgpa8rjg9se8rjg98awejr9834jmf9328m4f9rf908sewrjf089wqjef09q324jkf0834jfg089serjg9aewkfiqwepfkasklpdlfdöböhösögwskgweoo0ewrplawkofijasegiqew90ru8uru98r9igkjwaeifjasoijdfjioasijfadef€£$]]€£}€}£$@££ððđ““ŋ“đđŋ”””';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 422);
			t.equal(body, 'Unprocessable Entity\nUsername to long; maximum 191 UTF-8 characters allowed');

			cb();
		});
	});

	// Malformed uuid
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PATCH';
		reqOptions.body = {};
		reqOptions.body.uuid = 'bork';
		reqOptions.body.fields = {};
		reqOptions.body.fields.palt = 'korv';
		reqOptions.body.fields.beff = 'yes';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 400);
			t.equal(body, 'Bad Request\nProvided uuid has an invalid format');

			cb();
		});
	});

	// Username taken
	tasks.push(function (cb) {
		const username = uuidv1();

		UserLib.instance.create(username, 'foo', {bar: 'baz'}, function (err, firstUser) {
			if (err) return cb(err);

			UserLib.instance.create(uuidv1(), 'foo', {bar: 'baz'}, function (err, secondUser) {
				const reqOptions = {};

				if (err) return cb(err);

				t.notEqual(firstUser.uuid, secondUser.uuid);

				reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
				reqOptions.method = 'PATCH';
				reqOptions.body = {};
				reqOptions.body.uuid = secondUser.uuid;
				reqOptions.body.username = username;
				reqOptions.json = true;

				request(reqOptions, function (err, response, body) {
					if (err) return cb(err);

					t.equal(response.statusCode, 422);
					t.equal(body, 'Unprocessable Entity\nUsername is taken by another user');

					cb();
				});
			});
		});
	});

	// User not found
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PATCH';
		reqOptions.body = {};
		reqOptions.body.uuid = uuidv1();
		reqOptions.body.fields = {};
		reqOptions.body.fields.palt = 'korv';
		reqOptions.body.fields.beff = 'yes';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 404);
			t.equal(body, 'Not Found');

			cb();
		});
	});

	async.parallel(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PATCH user - fields', function (t) {
	const userUuid = uuidv1();


	const tasks = [];

	// Create user
	tasks.push(function (cb) {
		UserLib.instance.create('patchUser', 'dkfalls', {bing: 'bong', palt: 'koma'}, userUuid, cb);
	});

	// Run request
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PATCH';
		reqOptions.body = {};
		reqOptions.body.uuid = userUuid;
		reqOptions.body.fields = {};
		reqOptions.body.fields.palt = 'korv';
		reqOptions.body.fields.beff = 'yes';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);

			t.equal(body.username, 'patchUser');
			t.equal(body.uuid, userUuid);
			t.equal(body.fields.bing.length, 1);
			t.equal(body.fields.bing[0], 'bong');
			t.equal(body.fields.palt.length, 1);
			t.equal(body.fields.palt[0], 'korv');
			t.equal(body.fields.beff.length, 1);
			t.equal(body.fields.beff[0], 'yes');
			t.equal(Object.keys(body.fields).length, 3);

			cb();
		});
	});

	// Check data in database
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_users WHERE username = \'patchUser\'', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length, 1);
			t.equal(lUtils.formatUuid(rows[0].uuid), userUuid);
			t.equal(rows[0].username, 'patchUser');

			cb();
		});
	});

	tasks.push(function (cb) {
		let sql = '';

		sql += 'SELECT u.username, f.name AS fieldName, ud.data\n';
		sql += 'FROM user_users_data ud\n';
		sql += ' JOIN user_users u ON u.uuid = ud.userUuid\n';
		sql += ' JOIN user_data_fields f ON f.uuid = ud.fieldUuid\n';
		sql += 'WHERE u.username = ?\n';
		sql += 'ORDER BY ud.data';

		db.query(sql, ['patchUser'], function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length, 3);
			t.equal(rows[0].username, 'patchUser');
			t.equal(rows[0].fieldName, 'bing');
			t.equal(rows[0].data, 'bong');
			t.equal(rows[1].fieldName, 'palt');
			t.equal(rows[1].data, 'korv');
			t.equal(rows[2].fieldName, 'beff');
			t.equal(rows[2].data, 'yes');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PATCH user - username', function (t) {
	const userUuid = uuidv1();


	const tasks = [];

	// Create user
	tasks.push(function (cb) {
		UserLib.instance.create('patchUser_username', 'dkfalls', {bing: 'bong', palt: 'koma'}, userUuid, cb);
	});

	// Run request
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PATCH';
		reqOptions.body = {};
		reqOptions.body.uuid = userUuid;
		reqOptions.body.username = 'patchUser_username_updated';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);

			t.equal(body.username, 'patchUser_username_updated');
			t.equal(body.uuid, userUuid);
			t.equal(body.fields.bing.length, 1);
			t.equal(body.fields.bing[0], 'bong');
			t.equal(body.fields.palt.length, 1);
			t.equal(body.fields.palt[0], 'koma');
			t.equal(Object.keys(body.fields).length, 2);

			cb();
		});
	});

	// Check data in database
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_users WHERE username = \'patchUser_username_updated\'', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length, 1);
			t.equal(lUtils.formatUuid(rows[0].uuid), userUuid);

			cb();
		});
	});

	tasks.push(function (cb) {
		let sql = '';

		sql += 'SELECT u.username, f.name AS fieldName, ud.data\n';
		sql += 'FROM user_users_data ud\n';
		sql += ' JOIN user_users u ON u.uuid = ud.userUuid\n';
		sql += ' JOIN user_data_fields f ON f.uuid = ud.fieldUuid\n';
		sql += 'WHERE u.username = ?\n';
		sql += 'ORDER BY ud.data';

		db.query(sql, ['patchUser_username_updated'], function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length, 2);
			t.equal(rows[0].fieldName, 'bing');
			t.equal(rows[0].data, 'bong');
			t.equal(rows[1].fieldName, 'palt');
			t.equal(rows[1].data, 'koma');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('PATCH user - username and fields', function (t) {
	const userUuid = uuidv1();


	const tasks = [];

	// Create user
	tasks.push(function (cb) {
		UserLib.instance.create('patchUser_username_and_fields', 'dkfalls', {bing: 'bong', palt: 'koma'}, userUuid, cb);
	});

	// Run request
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'PATCH';
		reqOptions.body = {};
		reqOptions.body.uuid = userUuid;
		reqOptions.body.username = 'patchUser_username_and_fields_updated';
		reqOptions.body.fields = {};
		reqOptions.body.fields.palt = 'korv';
		reqOptions.body.fields.beff = 'yes';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);

			t.equal(body.username, 'patchUser_username_and_fields_updated');
			t.equal(body.uuid, userUuid);
			t.equal(body.fields.bing.length, 1);
			t.equal(body.fields.bing[0], 'bong');
			t.equal(body.fields.palt.length, 1);
			t.equal(body.fields.palt[0], 'korv');
			t.equal(body.fields.beff.length, 1);
			t.equal(body.fields.beff[0], 'yes');
			t.equal(Object.keys(body.fields).length, 3);

			cb();
		});
	});

	// Check data in database
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_users WHERE username = \'patchUser_username_and_fields_updated\'', function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length, 1);
			t.equal(lUtils.formatUuid(rows[0].uuid), userUuid);

			cb();
		});
	});

	tasks.push(function (cb) {
		let sql = '';

		sql += 'SELECT u.username, f.name AS fieldName, ud.data\n';
		sql += 'FROM user_users_data ud\n';
		sql += ' JOIN user_users u ON u.uuid = ud.userUuid\n';
		sql += ' JOIN user_data_fields f ON f.uuid = ud.fieldUuid\n';
		sql += 'WHERE u.username = ?\n';
		sql += 'ORDER BY ud.data';

		db.query(sql, ['patchUser_username_and_fields_updated'], function (err, rows) {
			if (err) return cb(err);

			t.equal(rows.length, 3);
			t.equal(rows[0].username, 'patchUser_username_and_fields_updated');
			t.equal(rows[0].fieldName, 'bing');
			t.equal(rows[0].data, 'bong');
			t.equal(rows[1].fieldName, 'palt');
			t.equal(rows[1].data, 'korv');
			t.equal(rows[2].fieldName, 'beff');
			t.equal(rows[2].data, 'yes');

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('DELETE USER, malformed statements', function (t) {
	// Malformed request, invalid uuid
	const reqOptions = {};

	reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
	reqOptions.method = 'DELETE';
	reqOptions.body = {};
	reqOptions.body.uuid = 'blurgh';
	reqOptions.json = true;

	request(reqOptions, function (err, response, body) {
		if (err) return cb(err);

		t.equal(response.statusCode, 400);
		t.equal(body, 'Bad Request\nProvided uuid has an invalid format');

		t.end();
	});
});

test('DELETE user', function (t) {
	const userUuid = uuidv1();
	const tasks = [];

	// Create user
	tasks.push(function (cb) {
		UserLib.instance.create('deleteUser', 'stolle', {weng: 'wong'}, userUuid, cb);
	});

	// Delete
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
		reqOptions.method = 'DELETE';
		reqOptions.body = {};
		reqOptions.body.uuid = userUuid;
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(response.statusCode, 200);
			t.equal(body, 'acknowledged');

			cb();
		});
	});

	// Check database
	tasks.push(function (cb) {
		// Seems we might have some kind of race condition here... or cache... or something else
		setTimeout(function () {
			db.query('SELECT uuid FROM user_users WHERE username = ?', 'deleteUser', function (err, rows) {
				if (err) return cb(err);

				t.equal(rows.length, 0);
				cb();
			});
		}, 50);
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
