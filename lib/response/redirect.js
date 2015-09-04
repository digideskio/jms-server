var default_cacheControl = 'public, max-age=300, s-maxage=300';

/**
 * get redirect location header
 *
 * @param moduleRequest
 *
 * @returns {string}
 */
function getLocation (moduleRequest) {
	var location = '/js/+';

	location += moduleRequest.include.join(',');

	if (moduleRequest.exclude.length > 0) {
		location += '-';
		location += moduleRequest.exclude.join(',');
	}

	location += '.js';

	if (moduleRequest.url.search) {
		location += moduleRequest.url.search;
	}

	return location;
}

/**
 *
 * @param request
 * @param reply
 * @param moduleRequest
 */
module.exports = function redirectResponse (request, reply) {

	var server = request.server;
	var config = server.settings.app;
	var moduleRequest = request.moduleRequest;

	server.log(['info','redirectResponse'],[moduleRequest.remoteAddress, moduleRequest.href].join(' '));

	var response = reply('');

	response.header('Expires', (new Date(+new Date() + 300000)).toUTCString());

				var cacheControl = default_cacheControl;
				if (config.cacheControl) {
					cacheControl = config.cacheControl.redirectResponse || default_cacheControl
				}

	response.header('Cache-Control', cacheControl);
	response.charset('utf8');
	response.redirect(getLocation(moduleRequest));
};
