var http           = require('http');
var config         = require('jms-config');

var paths          = require('../../lib/paths');
var log            = require(paths.libdir + '/debug/log');
var monitConf      = config.monit;

function onResponseData (err, clientRequest, httpResponse, moduleRequest) {

	if (err) {
		httpResponse.writeHead(500, {});
		httpResponse.end('', 'utf8');
		return;
	}

	log.verbose('statusResponse', [moduleRequest.remoteAddress, moduleRequest.href].join(' '));

	httpResponse.writeHead(clientRequest.statusCode, {});
	httpResponse.end('', 'utf8');

}

function onResponse(err, httpResponse, moduleRequest, clientRequest) {
	if (err) {
		return onResponseData(err, httpResponse, moduleRequest, clientRequest)
	}

	clientRequest.on('data', onResponseData.bind(null, null, clientRequest, httpResponse, moduleRequest));
}

module.exports = function (request, httpResponse, moduleRequest) {

	var options = {
		port: monitConf.port,
		hostname: monitConf.host,
		method: 'GET',
		path: '/'
	};

	var req = http.request(options);
	req.end();

	req.on('response', onResponse.bind(null, null, httpResponse, moduleRequest));
	req.on('error', function (err) {
		onResponse.bind(null, err, httpResponse, moduleRequest)
	});
}