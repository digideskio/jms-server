/**
 *
 * @param request
 * @param response
 * @param err
 * @param moduleRequest
 */
module.exports = function cachedResponse (request, reply) {

	var server = request.server;
	var config = server.settings.app;
	var moduleRequest = request.moduleRequest;

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

	server.log(['info','cachedResponse'], [moduleRequest.remoteAddress, moduleRequest.href].join(' '));

	var response = reply(responseBody);

	response.code(responseStatus);
	response.bytes(responseLength);

	response.encoding('utf8');
	response.charset('application/x-javascript');

	response.header('Cache-Control', config.cacheControl.cachedResponse);
	response.header('Expires', (new Date(+new Date() + 2500834000)).toUTCString());
	response.header('Last-Modified', cached.lastModified.toUTCString());
	response.header('X-JMS-Cache', 'HIT');

}
