var config         = require('jms-config');

var statistics     = require('lib/server/stats');
var log            = require('lib/debug/log');

/**
 *
 * @param request
 * @param response
 * @param err
 * @param moduleRequest
 */
module.exports = function cachedResponse (request, reply) {


	var moduleRequest = request.moduleRequest;

	if (moduleRequest.timer) {
		moduleRequest.timer.push({sendingResponse: +new Date()});
	}

	var cached = moduleRequest.response;

	cached.lastModified = new Date(cached.lastModified);

	if (request.headers['if-modified-since']) {
		var ifModifiedSince = new Date(request.headers['if-modified-since']);

		if (+cached.lastModified <= +ifModifiedSince) {
			var responseStatus = 304;
			var responseLength = 0;
			var responseBody = '';
		} else {
			var responseStatus = 200;
			var responseLength = cached.length;
			var responseBody = cached.source;
		}
	} else {
		var responseStatus = 200;
		var responseLength = cached.length;
		var responseBody = cached.source;
	}

	log.info('cachedResponse', [moduleRequest.remoteAddress, moduleRequest.href].join(' '));

	var response = reply(responseBody);

	response.code(responseStatus);
	response.bytes(responseLength);


	if (moduleRequest.timer) {
		response.header('JMS-Timers', JSON.stringify(moduleRequest.timer));
	}

	response.encoding('utf8');
	response.charset('application/x-javascript');

	response.header('Cache-Control', config.cacheControl.cachedResponse);
	response.header('Expires', (new Date(+new Date() + 2500834000)).toUTCString());
	response.header('Last-Modified', cached.lastModified.toUTCString());
	response.header('X-JMS-Cache', 'HIT');

	statistics.out();

}
