'use strict';

const	topLogPrefix	= 'larvituser-api: ./index.js - ',
	ArgParser	= require('argparse').ArgumentParser,
	userLib	= require('larvituser'),
	Api	= require('larvitbase-api'),
	log	= require('winston'),
	fs	= require('fs'),
	db	= require('larvitdb'),
	parser = new ArgParser({
		'addHelp':	false, // -h was reserved for help so had to disable :/
		'description':	'Larvituser-api example'
	});

parser.addArgument(['-cd', '--configDir'], {'help': '/path/to/dir/with/config/files'});
parser.addArgument(['-h', '--host'], {'help': '127.0.0.1'});
parser.addArgument(['-s', '--socket'], {'help': '/path/to/socket/file'});
parser.addArgument(['-u', '--user'], {'help': 'username'});
parser.addArgument(['-p', '--password'], {'help': 'password'});
parser.addArgument(['-port', '--port'], {'help': '3306'});
parser.addArgument(['-db', '--database'], {'help': 'database_name'});
parser.addArgument(['-amqp', '--amqp'], {'help': 'amqp://username:password@127.0.0.1'});

function UserApi(options) {
	const	logPrefix	= topLogPrefix + 'UserApi() - ',
		that	= this;

	that.options	= options;

	if ( ! that.options)	that.options	= {};

	that.api	= new Api(that.options);

	// Parse all incoming data as JSON
	that.api.middleware.splice(1, 0, function (req, res, cb) {
		if (req.rawBody) {
			try {
				req.jsonBody	= JSON.parse(req.rawBody.toString());
			} catch (err) {
				res.statusCode	= 400;
				res.end('"Bad Request\nProvided body is not a valid JSON string"');
				log.verbose(logPrefix + 'Could not JSON parse incoming body. err: ' + err.message);
				return;
			}
		}

		cb();
	});
};

UserApi.prototype.start = function (cb) {
	const	logPrefix	= topLogPrefix + 'Api.prototype.start() - ',
		that	= this;

	if ( ! cb) cb = function () {};

	if ( ! that.options.db) {
		const	err	= new Error('Db instance not present');
		log.warn(logPrefix + err.message);
		return cb(err);
	}

	userLib.dataWriter.intercom	= that.options.intercom;
	userLib.dataWriter.mode	= that.options.mode;
	userLib.options = {
		'amsync': that.options.amsync
	};

	log.info(logPrefix + '===--- Larvituser-api starting ---===');

	userLib.ready(function (err) {
		if (err) return cb(err);

		that.api.start(cb);
	});;
};

UserApi.prototype.stop = function (cb) {
	const that = this;
	that.api.stop(cb);
};

exports = module.exports = UserApi;

// Running from console
if (require.main === module) {
	const	args	= parser.parseArgs();

	let	options,
		api,
		cd;

	if (args.configDir) {
		console.log('Looking for config files in "' + args.configDir + '"');
		cd	= args.configDir;
	} else if ((args.host || args.socket) && args.user && args.password && args.database) {
		options = {
			'db': {
				'host':	args.host + (args.port ? ':' + args.port : ''),
				'socketPath':	args.socket,
				'user':	args.user,
				'password':	args.password,
				'database':	args.database,
				'connectionLimit':	10,
				'charset':	'utf8mb4_general_ci',
				'supportBigNumbers':	true,
				'recoverableErrors':	['PROTOCOL_CONNECTION_LOST', 'ER_LOCK_DEADLOCK', 'ETIMEDOUT']
			}
		};
		console.log('Using configuration options from arguments');
	} else {
		cd	= __dirname + '/config';
		console.log('Looking for config files in "' + cd + '"');
	}

	if (cd && fs.existsSync(cd)) {
		options = {
			'amsync':	fs.existsSync(__dirname + '/config/amsync.json') ? require(__dirname + '/config/amsync.json') : null,
			'lBaseOptions':	fs.existsSync(__dirname + '/config/server.json') ? require(__dirname + '/config/server.json') : null,
			'amqp':	fs.existsSync(__dirname + '/config/amqp.json') ? require(__dirname + '/config/amqp.json') : null,
			'log':	fs.existsSync(__dirname + '/config/log.json') ? require(__dirname + '/config/log.json') : null,
			'db':	fs.existsSync(__dirname + '/config/db.json') ? require(__dirname + '/config/db.json') : null
		};

		if (options.db === null) options = null;
	}

	if (options && options.db) {
		db.setup(options.db);
		options.db	= db;
		api	= new UserApi(options);
		api.start(function (err) {
			if (err) throw err;
			console.log('Api up and running on port ' + api.api.lBase.httpServer.address().port);
		});
	} else {
		console.log('Invalid or insufficient parameters');
		process.exit(1);
	}
}
