require('app-module-path').addPath(__dirname.replace('/lib', ''));

/**
 *
 * this is just a notepad place
 *
 * TODO
 * pull in external plugins more nicer way
 *
 *
 * API (/api/getModuleByHash, /api/getHashOfModule etc)
 *
 */


var Hapi          = require('hapi');
var config        = require('jms-config');

var log           = require('lib/debug/log');
var errbit        = require('lib/debug/errbit')('moduleserver');

var netConf       = config.network;

var serverOptions = {
	app: config,
	load: {
		sampleInterval: 1000
	}
}

if (config.cache.enabled) {
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
		register: require('jms-server-modulerequest')
	},
	function (err) {
		if (err) log.error('server', err);
	}
);

server.register({
		register: require('jms-server-cache')
	},
	function (err) {
		if (err) log.error('server', err);
	}
);

//
// methods
//
if (!server.settings.app.context.local) {
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
		handler: require('lib/server/status').bind(server)
	},
	{
		method: 'GET',
		path: '/js/{source}/{stage}/{modules*}',
		handler: require('lib/server/handler')
	}
]);

module.exports = function () {
	server.start(function () {
		log.info('server','Server running as [' + server.info.host + '] at http://' + server.info.address + ':' + server.info.port + '/');
	});
}