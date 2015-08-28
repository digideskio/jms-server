require('app-module-path').addPath(__dirname.replace('/lib', ''));

/**
 *
 * this is just a notepad place
 *
 * TODO
 *
 *
 */


var Hapi          = require('hapi');
var log           = require('lib/debug/log');

function init (config) {
	var netConf = config.network;


	config.version = require('./package.json').version;

	var serverOptions = {
		app: config,
		load: {
			sampleInterval: 1000
		}
	}

	if (config.cache && config.cache.enabled) {
		config.cache.engine = require(config.cache.engine);
		serverOptions.cache = config.cache;
	}

	var server = new Hapi.Server(serverOptions);

	server.connection({
		address: netConf.host,
		port: netConf.port
	});

//
// internal plugins
//

	server.register({
			register: require('lib/modulerequest')
		},
		function (err) {
			if (err) log.error('server', err);
		}
	);
	if (config.cache && config.cache.enabled) {
		server.register({
				register: require('lib/cache')
			},
			function (err) {
				if (err) log.error('server', err);
			}
		);
	}

//
// methods
//
	if (!server.settings.app.context || !(server.settings.app.context && server.settings.app.context.local)) {
		server.method(
			'storage',
			require('jms-storage').use('redis'),
			{
				bind: server
			}
		);
	}

	server.method(
		'getModules',
		require('lib/method/getmodules'),
		{
			bind: server
		}
	);


// API
	require('jms-api')(server);


//
// debug & logging
//

	server.on('log', function (event, tags) {

		if (tags.verbose) {
			log.verbose(event.tags.slice(1), event.data);
		} else if (tags.info) {
			log.info(event.tags.slice(1), event.data);
		} else if (tags.warn) {
			log.warn(event.tags.slice(1), event.data);
		} else if (tags.error) {
			log.error(event.tags.slice(1), event.data);
		}

	});

//
// routes
//

	server.route([
		{
			method: '*',
			path: '/{p*}',
			handler: function (request, reply) {
				return reply('').code(200);
			}
		},
		{
			method: 'GET',
			path: '/status',
			handler: require('lib/handlers/status').bind(server)
		},
		{
			method: 'GET',
			path: '/js/{source}/{stage}/{modules*}',
			handler: require('lib/handlers/module')
		},
		{
			method: 'GET',
			path: '/js/{modules*}',
			handler: require('lib/handlers/module')
		}
	]);

	return server;
}


module.exports = function (config) {

	log = log(config);

	var server = init(config);

	server.start(function () {
		log.info('server','Server running as [' + server.info.host + '] at http://' + server.info.address + ':' + server.info.port + '/');
	});
}