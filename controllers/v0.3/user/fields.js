'use strict';

const lUtils = new (require('larvitutils').Utils)();

function controller(req, res, cb) {
	if (req.method.toUpperCase() !== 'GET') {
		res.statusCode = 405;
		res.data = '405 Method Not Allowed\nAllowed method(s): GET';

		return cb();
	}

	req.db.query('SELECT * FROM user_data_fields ORDER BY name', function (err, rows) {
		if (err) return cb(err);

		res.data = [];

		for (let i = 0; rows[i] !== undefined; i++) {
			const row = rows[i];

			res.data.push({
				uuid: lUtils.formatUuid(row.uuid),
				name: row.name
			});
		}

		cb();
	});
};

exports = module.exports = controller;
