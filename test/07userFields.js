'use strict';

const UserApi = require(__dirname + '/../index.js');
const request = require('request');
const uuidv4 = require('uuid/v4');
const lUtils = new (require('larvitutils').Utils)();
const async = require('async');
const test = require('tape');
const db = require('larvitdb');

test('GET user field names', function (t) {
	const localFieldNames = [];
	const tasks = [];

	let localRecords;

	localFieldNames.push('Very strange name that should not be used. d999df2lllffg');
	localFieldNames.push('And another yet so. 9999d9faxx');

	// Make sure there are at least one field in the database
	tasks.push(function (cb) {
		const dbFields = [];
		const sql = 'INSERT INTO user_data_fields (uuid, name) VALUES(?,?),(?,?);';

		dbFields.push(lUtils.uuidToBuffer(uuidv4()));
		dbFields.push(localFieldNames[0]);
		dbFields.push(lUtils.uuidToBuffer(uuidv4()));
		dbFields.push(localFieldNames[1]);

		db.query(sql, dbFields, cb);
	});

	// Get local database records
	tasks.push(function (cb) {
		db.query('SELECT * FROM user_data_fields ORDER BY name', function (err, rows) {
			localRecords = rows;
			cb(err);
		});
	});

	// Request API and check results against local database
	tasks.push(function (cb) {
		const reqOptions = {};

		reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user/fields';
		reqOptions.method = 'GET';
		reqOptions.json = true;

		request(reqOptions, function (err, response, body) {
			if (err) return cb(err);

			t.equal(body.length, localRecords.length);
			t.equal(response.statusCode, 200);

			for (let i = 0; localRecords[i] !== undefined; i++) {
				const localRecord = localRecords[i];
				const remoteRecord = body[i];

				t.equal(lUtils.formatUuid(localRecord.uuid), remoteRecord.uuid);
				t.equal(localRecord.name, remoteRecord.name);
			}

			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Invalid method', function (t) {
	const reqOptions = {};

	reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user/fields';
	reqOptions.method = 'DELETE';
	reqOptions.json = true;
	reqOptions.body = {};

	request(reqOptions, function (err, response) {
		if (err) return cb(err);

		t.equal(response.statusCode, 405);

		t.end();
	});
});
