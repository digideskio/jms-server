var Hapi = require('hapi');
var config = require('jms-config');
var paths = require('./paths');

var Boom = require('boom');

var responsehandler = require(paths.libdir + '/server/handler');
var statushandler  = require(paths.libdir + '/server/status');
var log            = require(paths.libdir + '/debug/log');

var errbit         = require(paths.libdir + '/debug/errbit')('moduleserver');

var netConf        = config.network;

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



/*
todo:


	cache config -> config
	cache object -> jms-server-cache .getConfig


	/status -> own handler


	storage -> server method
	log -> server log

 */


/*
 internal plugins
*/

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





var stat = function (server, options, next) {

	server.ext('onPreHandler', function (request, reply) {
		console.log('onPreHandler' );

		reply.continue();
	})

	server.ext('onPostHandler', function (request, reply) {
		console.log('onPostHandler' );

		reply.continue();
//
	})

	server.ext('onPreResponse', function (request, reply) {
		console.log('onPreResponse' );

		reply.continue();
	})

	next();
}

stat.attributes = {
	name: 'stats',
	version: '1.0.0'
}
/*
server.register({
	register: stat,
	options: {
		log: log,
		storage: storage,
		config: config
	}
}, function (err) {
	if (err) log.error('server', err);
});

*/

server.method(
	'storage',
	require('jms-storage').use('redis'),
	{
		bind: server,
		/*
		cache: {
			segment: 'storage',
			expiresIn: 2000
		}
		*/

	}
)

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

/*
	routing
*/
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
		handler: statushandler.bind(server)
	},
	{
		method: 'GET',
		path: '/js/{source}/{stage}/{modules*}',
		handler: responsehandler
	}
]);

module.exports = function () {
	server.start(function () {
		log.info('server','Server running as [' + server.info.host + '] at http://' + server.info.address + ':' + server.info.port + '/');
	});
}