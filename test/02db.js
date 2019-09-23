'use strict';

const test = require('tape');
const db = require('larvitdb');
const {Log} = require('larvitutils');

let options;

if (process.env.DBCONFFILE === undefined) {
	options = require(__dirname + '/../config/db_test.json');
} else {
	options = require(__dirname + '/../' + process.env.DBCONFFILE);
}

if (!options.log) {
	options.log = new Log('warn');
}

test('Check db', function (t) {
	db.setup(options, function (err) {
		if (err) throw err;

		db.removeAllTables(function (err) {
			if (err) throw err;
			t.end();
		});
	});
});
