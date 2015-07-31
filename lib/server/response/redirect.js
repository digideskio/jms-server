var config           = require('jms-config');

var statistics       = require('lib/server/stats');
var log              = require('lib/debug/log');


function getLocation (moduleRequest) {
	var location = '/js/' + moduleRequest.source + '/' +moduleRequest.stage + '/+';

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
module.exports = function redirectResponse (request, reply, moduleRequest) {

	log.info('redirectResponse',[moduleRequest.remoteAddress, moduleRequest.href].join(' '));

	var response = reply('');

	if (moduleRequest.timer) {
		moduleRequest.timer.push({redirectResponse: +new Date()});
		moduleRequest.timer.push({sendingResponse: +new Date()});
		response.header('JMS-Timers', JSON.stringify(moduleRequest.timer));
	}

	response.header('Expires', (new Date(+new Date() + 300000)).toUTCString());
	response.header('Cache-Control', config.cacheControl.redirectResponse);
	response.charset('utf8');
	response.redirect(getLocation(moduleRequest));

	statistics.out();
};
