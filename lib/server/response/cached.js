var config         = require('jms-config');

var paths          = require('../../paths');
var statistics     = require(paths.libdir + '/server/stats');
var log            = require(paths.libdir + '/debug/log');

/**
 *
 * @param request
 * @param response
 * @param err
 * @param moduleRequest
 */
module.exports = function cachedResponse (request, hapiReply, err, moduleRequest) {

	if (moduleRequest.timer) {
		moduleRequest.timer.push({sendingResponse: +new Date()});
	}

	var cached = moduleRequest.response;

	cached.last_modified = new Date(cached.last_modified);

	if (request.headers['if-modified-since']) {
		var ifModifiedSince = new Date(request.headers['if-modified-since']);

		if (+cached.last_modified <= +ifModifiedSince) {
			var responseStatus = 304;
			var responseLength = 0;
			var responseBody = '';
		} else {
			var responseStatus = 200;
			var responseLength = cached.responseLength;
			var responseBody = cached.response;
		}
	} else {
		var responseStatus = 200;
		var responseLength = cached.responseLength;
		var responseBody = cached.response;
	}

	log.info('cachedResponse', [moduleRequest.remoteAddress, moduleRequest.href].join(' '));

	var response = hapiReply(responseBody)

	response.code(responseStatus);
	response.bytes(responseLength);


	if (moduleRequest.timer) {
		response.header('JMS-Timers', JSON.stringify(moduleRequest.timer));
	}

	response.encoding('utf8');
	response.charset('application/x-javascript');

	response.header('Cache-Control', config.cacheControl.cachedResponse);
	response.header('Expires', (new Date(+new Date() + 2500834000)).toUTCString());
	response.header('Last-Modified', cached.last_modified.toUTCString());
	response.header('X-JMS-Cache', 'HIT');

	statistics.out();

}
