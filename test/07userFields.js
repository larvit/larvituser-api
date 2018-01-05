'use strict';

const	UserApi	= require(__dirname + '/../index.js'),
	request	= require('request'),
	uuidv4	= require('uuid/v4'),
	lUtils	= require('larvitutils'),
	async	= require('async'),
	test	= require('tape'),
	db	= require('larvitdb');

test('GET user field names', function (t) {
	const	localFieldNames	= [],
		tasks	= [];

	let	localRecords;

	localFieldNames.push('Very strange name that should not be used. d999df2lllffg');
	localFieldNames.push('And another yet so. 9999d9faxx');

	// Make sure there are at least one field in the database
	tasks.push(function (cb) {
		const	dbFields	= [],
			sql	= 'INSERT INTO user_data_fields (uuid, name) VALUES(?,?),(?,?);';

		dbFields.push(lUtils.uuidToBuffer(uuidv4()));
		dbFields.push(localFieldNames[0]);
		dbFields.push(lUtils.uuidToBuffer(uuidv4()));
		dbFields.push(localFieldNames[1]);

		db.query(sql, dbFields, cb);
	});

	// Get local database records
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_data_fields ORDER BY name', function (err, rows) {
			localRecords	= rows;
			cb(err);
		});
	});

	// Request API and check results against local database
	tasks.push(function (cb) {
		const	reqOptions	= {};

		reqOptions.url	= 'http://localhost:' + UserApi.instance.api.lBase.httpServer.address().port + '/user/fields';
		reqOptions.method	= 'GET';
		reqOptions.json	= true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(body.length,	localRecords.length);
			t.equal(response.statusCode,	200);

			for (let i = 0; localRecords[i] !== undefined; i ++) {
				const	localRecord	= localRecords[i],
					remoteRecord	= body[i];

				t.equal(lUtils.formatUuid(localRecord.uuid),	remoteRecord.uuid);
				t.equal(localRecord.name,	remoteRecord.name);
			}

			t.end();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});
