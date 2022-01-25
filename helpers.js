'use strict';

async function cbErrOnException(fn, cb) {
	try {
		await fn();
	} catch (err) {
		return cb(err);
	}
}

module.exports = {
	cbErrOnException
};
