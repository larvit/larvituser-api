'use strict';

const	UserApi	= require(__dirname + '/../index.js');
const UserLib	= require('larvituser');
const lUtils	= new (require('larvitutils'))();
const request	= require('request');
const async	= require('async');
const test	= require('tape');
const db	= require('larvitdb');
const fs	= require('fs');
const options = {
	'amqp': { 'default': 'loopback interface' },
	'amsync':	{},
	'log':	new lUtils.Log('warn'),
	'db':	db
};

let dbOptions;

if (process.env.DBCONFFILE === undefined) {
	dbOptions = require(__dirname + '/../config/db_test.json');
} else {
	dbOptions = require(__dirname + '/../' + process.env.DBCONFFILE);
}

if (! dbOptions.log) {
	dbOptions.log = new lUtils.Log('warn');
}

test('Init db', function (t) {
	db.setup(dbOptions, t.end);
});

test('Init userlib', function (t) {
	const userLib = new UserLib(options, function (err) {
		if (err) throw err;

		UserLib.instance = userLib;

		t.end();
	});
});

test('Trying to start API without options', function (t) {
	let iErr;

	try {
		new UserApi();
	} catch (err) {
		iErr = true;
		t.equal(err.message,	'Db instance not present');
	}

	t.equal(iErr, true);
	t.end();
});

test('Get a response from a controller', function (t) {
	const	tasks	= [];

	// Initialize api
	tasks.push(function (cb) {
		UserApi.instance = new UserApi(options);
		UserApi.instance.start(cb);
	});

	// Try 200 request for Readme.md
	tasks.push(function (cb) {
		request('http://localhost:' + UserApi.instance.api.base.httpServer.address().port, function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);
			t.equal(body.length,	fs.readFileSync(__dirname + '/../README.md').toString().length);
			cb();
		});
	});

	// Try 404 request
	tasks.push(function (cb) {
		request('http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/foo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	404);
			t.equal(body,	'"URL endpoint not found"');
			cb();
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Malformed request body', function (t) {
	const	reqOptions	= {};

	reqOptions.url	= 'http://localhost:' + UserApi.instance.api.base.httpServer.address().port + '/user';
	reqOptions.method	= 'PUT';
	reqOptions.body	= '{"reven":"NEJ" and no closing thingie and also this text';

	request(reqOptions, function (err, response, body) {
		if (err) return cb(err);
		t.equal(response.statusCode,	400);
		t.equal(body,	'"Bad Request\nProvided body is not a valid JSON string"');
		t.end();
	});
});
