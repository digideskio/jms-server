var Hapi = require('hapi');
var config = require('jms-config');

var paths = require('./paths');


var moduleResponse = require(paths.libdir + '/server/moduleresponse');
var log            = require(paths.libdir + '/debug/log');
var errbit         = require(paths.libdir + '/debug/errbit')('moduleserver');



var netConf        = config.network;

var server = new Hapi.Server();
server.connection({
	host: netConf.host,
	port: netConf.port
});

server.route({
	method: 'GET',
	path: '/js/{source}/{stage}/{modules*}',
	handler: moduleResponse
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