'use strict';

const	topLogPrefix	= 'larvituser-api ./utils.js - ',
	responseMessage	= {
		'400':	'Bad request',
		'405':	'Method not allowed',
		'500':	'Internal server error'
	};

function createErrorRes(res, statusCode, reason) {
	const responseObj = {
		'statusCose': statusCode,
		'error': responseMessage[statusCode],
		'reason': reason
	};

	if (statusCode === 500 && ! reason) responseObj.reason = 'Something went wrong. Please contact an administrator.';

	res.setHeader('Content-Type', 'application/json');
	res.statusCode	= statusCode;
	res.end(JSON.stringify(responseObj));
};

function parseJsonReq(req, cb) {
	let result = '';

	req.on('data', function (data) {
		result += data.toString();
	});

	req.on('end', function () {
		let parsedResult;

		try {
			parsedResult = JSON.parse(result);
		} catch (err) {
			return cb(err);
		};

		cb(null, parsedResult);
	});
}

exports.createErrorRes	= createErrorRes;
exports.parseJsonReq	= parseJsonReq;
