'use strict';

const	UserApi	= require(__dirname + '/../index.js'),
	request	= require('request'),
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

		reqOptions.body	= JSON.stringify(reqOptions.body);

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);

			console.log('body:');
			console.log(body);
			cb();
		});
	});

	// Check data in database
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_users', function (err, rows) {
			if (err) return cb(err);

			console.log('rows:');
			console.log(rows);
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});
