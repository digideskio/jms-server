var http           = require('http');
var util           = require('util');
var config         = require('jms-config');

var paths          = require('../../lib/paths');

var moduleresponse = require(paths.libdir + '/server/moduleresponse');
var log            = require(paths.libdir + '/debug/log');
var errbit         = require(paths.libdir + '/debug/errbit')('moduleserver');

var netConf        = config.network;

/**
 *
 * @param next
 * @constructor
 */
function ModuleServer () {
	http.Server.call(this);

	this.listen(netConf.port, netConf.host);
	this.on('request', moduleresponse);

	this.on('error', function (err) {
		err.params =  {
			config: netConf
		};
		errbit.notify(err);
	});

	log.info('ModuleServer','Server running at http://' + netConf.host + ':' + netConf.port + '/');

}

util.inherits(ModuleServer, http.Server);

module.exports = ModuleServer;
