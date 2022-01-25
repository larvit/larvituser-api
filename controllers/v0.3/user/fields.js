'use strict';

const lUtils = new (require('larvitutils').Utils)();

async function controller(req, res, cb) {
	if (req.method.toUpperCase() !== 'GET') {
		res.statusCode = 405;
		res.data = '405 Method Not Allowed\nAllowed method(s): GET';

		return cb();
	}

	try {
		const {rows} = await req.db.query('SELECT * FROM user_data_fields ORDER BY name');
		res.data = [];

		for (let i = 0; rows[i] !== undefined; i++) {
			const row = rows[i];

			res.data.push({
				uuid: lUtils.formatUuid(row.uuid),
				name: row.name
			});
		}
	} catch (err) {
		return cb(err);
	}

	return cb();
};

exports = module.exports = controller;
