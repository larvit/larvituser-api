'use strict';

const	test	= require('tape'),
	db	= require('larvitdb');

db.setup(require(__dirname + '/../config/db_test.json'));

test('Check db', function (t) {
	db.query('SHOW TABLES', function (err, rows) {
		if (err) throw err;

		t.equals(rows.length, 0);
		t.end();
	});
});
