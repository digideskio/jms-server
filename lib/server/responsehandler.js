var async            = require('async');

var redirectResponse = require('lib/server/response/redirect');
var cachedResponse   = require('lib/server/response/cached');
var statusResponse   = require('lib/server/response/status');
var moduleResponse   = require('lib/server/response/status');

var pluginmanager    = require('lib/pluginmanager/server');
var collector        = require('lib/server/collector');
var packager         = require('lib/server/packager');

/**
 *
 * @param request {Hapi.request}
 * @param reply {Hapi.reply}
 *
 * @returns {Object}
 */
function responseHandler (request, reply) {

//	console.log(request.moduleRequest);
	
	var moduleRequest = request.moduleRequest;

	if (moduleRequest.timer) {
		moduleRequest.timer.push({requestReceived: +new Date()});
		moduleRequest.timer.push({requestProcessed: +new Date()});
	}

	if (moduleRequest.redirect) {
		return redirectResponse(request, reply, moduleRequest);
	}

	if (moduleRequest.cached) {
		return cachedResponse(request, reply, null, moduleRequest);
	}

	async.waterfall([
		collector.bind(null, moduleRequest),
		pluginmanager.bind(null, moduleRequest),
		packager.bind(null, moduleRequest)
	], moduleResponse.bind(null, request, reply, moduleRequest));

}

/**
 *
 * @param request {Hapi.request}
 * @param reply {Hapi.reply}
 */
module.exports = responseHandler;
