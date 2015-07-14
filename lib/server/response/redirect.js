var config           = require('jms-config');
var paths            = require('../../paths');
var storage          = require(paths.libdir + '/storage');
var responseHandler  = require(paths.libdir + '/server/responsehandler');
var statistics       = require(paths.libdir + '/server/stats');
var log              = require(paths.libdir + '/debug/log');

/**
 *
 * @param request
 * @param hapiReply
 * @param moduleRequest
 */
module.exports = function redirectResponse (request, hapiReply, moduleRequest) {

	log.info('redirectResponse',[moduleRequest.remoteAddress, moduleRequest.href].join(' '));

	console.log(moduleRequest );

	var response = hapiReply('success')

	if (moduleRequest.timer) {
		moduleRequest.timer.push({redirectResponse: +new Date()});
	}

	if (moduleRequest.timer) {
		moduleRequest.timer.push({sendingResponse: +new Date()});
	}

	if (moduleRequest.timer) {
		response.header('JMS-Timers', JSON.stringify(moduleRequest.timer));
	}

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

	/*
	hapiReply.writeHead(302, {
		'Cache-Control': 'no-cache, no-store, private, must-revalidate, max-age=0, max-stale=0, post-check=0, pre-check=0',
		'Pragma': 'no-cache',
		'Expires': 0,
		'Location': location
	});
	*/


	response.header('Expires', (new Date(+new Date() + 300000)).toUTCString());
	response.header('Cache-Control', config.cacheControl.redirectResponse);
	response.charset('utf8');
	response.redirect(location);

	statistics.out();
};
