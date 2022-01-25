'use strict';

const UserApi = require(__dirname + '/../index.js');
const test = require('tape');
const fixture = require('./fixture');

test('Close API and clean db', function (t) {
	UserApi.instance.stop(async function (err) {
		if (err) throw err;

		await fixture.db.removeAllTables();
		t.end();
		process.exit(0);
	});
});
