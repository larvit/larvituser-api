'use strict';

const	Intercom	= require('larvitamintercom'),
	freeport	= require('freeport'),
	request	= require('request'),
	async	= require('async'),
	test	= require('tape'),
	Api	= require(__dirname + '/../index.js'),
	db	= require('larvitdb');

db.setup(require(__dirname + '/../config/db_test.json'));

test('Basic request', function (t) {
	const	tasks	= [];

	let	port,
		api;

	t.timeoutAfter(5000);

	// Get free port
	tasks.push(function (cb) {
		freeport(function (err, result) {
			port	= result;
			cb(err);
		});
	});

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			'db':	db,
			'intercom':	new Intercom('loopback interface'),
			'mode':	'master',
			'appOptions': {
				'httpOptions':	port
			}
		});

		api.start(cb);
	});

	// Try 200 request
	tasks.push(function (cb) {
		request('http://localhost:' + port + '/', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);
			t.equal(body,	'Hello world');
			cb();
		});
	});

	// Try 404 request
	tasks.push(function (cb) {
		request('http://localhost:' + port + '/foo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	404);
			t.equal(body,	'Internal server error: deng');
			cb();
		});
	});

	// Close server
	tasks.push(function (cb) {
		api.app.httpServer.close(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});
