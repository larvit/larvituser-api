'use strict';

const test = require('tape');
const Db = require('larvitdb');
const {Log} = require('larvitutils');
const fixture = require('./fixture');

let options;

if (process.env.DBCONFFILE === undefined) {
	options = require(__dirname + '/../config/db_test.json');
} else {
	options = require(__dirname + '/../' + process.env.DBCONFFILE);
}

if (!options.log) {
	options.log = new Log('warn');
}

test('Init db', async function () {
	const db = new Db(options);
	await db.removeAllTables();

	fixture.db = db;
});
