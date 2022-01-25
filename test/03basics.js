'use strict';

const UserApi = require(__dirname + '/../index.js');
const {UserLib} = require('larvituser');
const {Log} = require('larvitutils');
const fixture = require('./fixture');
const request = require('request');
const async = require('async');
const test = require('tape');
const fs = require('fs');

let options;

test('Init userlib', async function () {
	options = {
		log: new Log('warn'),
		db: fixture.db
	};

	const userLib = new UserLib(options);
	await userLib.runDbMigrations();
	UserLib.instance = userLib;
});

test('Trying to start API without options', function (t) {
	let iErr;

	try {
		new UserApi();
	} catch (err) {
		iErr = true;
		t.equal(err.message, 'Db instance not present');
	}

	t.equal(iErr, true);
	t.end();
});

test('Get a response from a controller', function (t) {
	const tasks = [];

	// Initialize api
	tasks.push(function (cb) {
		UserApi.instance = new UserApi(options);
		UserApi.instance.start(cb);
	});

	// Try 200 request for Readme.md
	tasks.push(function (cb) {
		request('http://localhost:' + UserApi.instance.api.base.httpServer.address().port, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body.length, fs.readFileSync(__dirname + '/../README.md').toString().length);
			cb();
		});
	});

	// Try 404 request
	tasks.push(function (cb) {
		request('http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/foo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 404);
			t.equal(body, '"URL endpoint not found"');
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Malformed request body', function (t) {
	const reqOptions = {};

	reqOptions.url = 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
	reqOptions.method = 'PUT';
	reqOptions.body = '{"reven":"NEJ" and no closing thingie and also this text';

	request(reqOptions, function (err, response, body) {
		if (err) return cb(err);
		t.equal(response.statusCode, 400);
		t.equal(body, '"Bad Request\nProvided body is not a valid JSON string"');
		t.end();
	});
});
