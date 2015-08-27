/**
 *
 * @param request
 * @param reply
 * @param moduleRequest
 * @param err
 * @param source
 * @param byteLength
 * @param lastModified
 */
module.exports = function moduleResponse (request, reply, err, source, byteLength, lastModified) {
	var server = request.server;
	var config = server.settings.app;
	var moduleRequest = request.moduleRequest;

	if (err) {
		server.log(['info','responsehandler'], [moduleRequest.remoteAddress, moduleRequest.href, ['Error', err].join(' ')].join(' '));

		return reply(err);
	}

	server.log(['info','responsehandler'], [moduleRequest.remoteAddress, moduleRequest.href].join(' '));

	var responseStatus = 200;

	var response = reply(source);

	if (request.headers['if-modified-since']) {
		var ifModifiedSince = new Date(request.headers['if-modified-since']);

		if (+lastModified <= +ifModifiedSince) {
			responseStatus = 304;
			byteLength = 0;
			source = '';
		}
	}

	response.code(200);
	response.header('Cache-Control', config.cacheControl.responseHandler);
	response.header('Expires', (new Date(+new Date() + 2500834000)).toUTCString());
	response.header('Last-Modified', lastModified.toUTCString());
	response.header('X-JMS-Cache', 'MISS');

	response.bytes(byteLength);
	response.encoding('utf8');
	response.charset('application/x-javascript');
};
