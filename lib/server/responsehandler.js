var config     = require('jms-config');

var paths      = require('../../lib/paths');
var log        = require(paths.libdir + '/debug/log');
var statistics = require(paths.libdir + '/server/stats');

/**
 *
 * @param request
 * @param hapiReply
 * @param moduleRequest
 * @param err
 * @param source
 * @param byteLength
 * @param lastModified
 */
module.exports = function responseHandler (request, hapiReply, moduleRequest, err, source, byteLength, lastModified) {

	if (moduleRequest.timer) {
		moduleRequest.timer.push({sendingResponse: +new Date() });
	}

	if (err) {
		log.info('responsehandler', [moduleRequest.remoteAddress, moduleRequest.href, ['Error', err].join(' ')].join(' '));

		var response = hapiReply(err);

		if (moduleRequest.timer) {
			response.output.headers['JMS-Timers'] = JSON.stringify(moduleRequest.timer);
		}

		statistics.out();
		return;
	}


	log.info('responsehandler', [moduleRequest.remoteAddress, moduleRequest.href].join(' '));

	var responseStatus = 200;

	var response = hapiReply(source);

	if (request.headers['if-modified-since']) {
		var ifModifiedSince = new Date(request.headers['if-modified-since']);

		if (+lastModified <= +ifModifiedSince) {
			responseStatus = 304;
			byteLength = 0;
			source = '';
		}
	}

	if (moduleRequest.timer) {
		response.header('JMS-Timers', JSON.stringify(moduleRequest.timer));
	}

	response.code(200);
	response.header('Cache-Control', config.cacheControl.responseHandler);
	response.header('Expires', (new Date(+new Date() + 2500834000)).toUTCString());
	response.header('Last-Modified', lastModified.toUTCString());
	response.header('X-JMS-Cache', 'MISS');

	response.bytes(byteLength);
	response.encoding('utf8');
	response.charset('application/x-javascript');


	/*
	if (moduleRequest.debug) {
		hapiReply.setHeader('X-SourceMap', moduleRequest.href.replace('.js', '.js.map'));
	}
	*/

	statistics.out();

};
