var Hapi = require('hapi');
var config = require('jms-config');
var paths = require('./paths');

var Boom = require('boom');

var moduleResponse = require(paths.libdir + '/server/moduleresponse');
var log            = require(paths.libdir + '/debug/log');
var storage        = require(paths.libdir + '/storage');
var errbit         = require(paths.libdir + '/debug/errbit')('moduleserver');

var netConf        = config.network;

var server = new Hapi.Server({
	app: config,
	cache: {
		engine: require('catbox-redis'),
		shared: true,
		host: '127.0.0.1',
		port: 6379,
		database: 2
	},
	load: {
		sampleInterval: 1000
	}
});

server.connection({
	host: netConf.host,
	port: netConf.port
});



/*
 internal plugins
*/

server.register({
	register: require('jms-server-modulerequest'),
	options: {
		log: log,
		storage: storage
	}
}, function (err) {
	if (err) log.error('server', err);
});

server.register({
	register: require('jms-server-cache'),
	options: {
	}
}, function (err) {
	if (err) log.error('server', err);
});





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


/*
	routing
*/
server.route({
	method: '*',
	path: '/{p*}',
	handler: function (request, reply) {
		return reply('Not found').code(404);
	}
});

server.route({
	method: 'GET',
	path: '/js/{source}/{stage}/{modules*}',
	handler: moduleResponse
});

server.route({
	method: 'GET',
	path: '/status',
	handler: function () {

	}
});

/*

 // some basic routing
 if (url.pathname == '/status') {
 moduleRequest.healthcheck = true;
 return done(null, originalRequest, hapiReply, moduleRequest);
 }

 */

module.exports = function () {
	server.start(function () {
		log.info('server','Server running at http://' + netConf.host + ':' + netConf.port + '/');
	});
}