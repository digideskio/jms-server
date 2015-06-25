var async            = require('async');
var paths            = require('../../lib/paths');

var redirectResponse = require(paths.libdir + '/server/response/redirect');
var cachedResponse   = require(paths.libdir + '/server/response/cached');
var statusResponse   = require(paths.libdir + '/server/response/status');

var responseHandler  = require(paths.libdir + '/server/responsehandler');
var modulerequest    = require(paths.libdir + '/server/modulerequest');
var pluginmanager    = require(paths.libdir + '/pluginmanager/server');
var collector        = require(paths.libdir + '/server/collector');
var packager         = require(paths.libdir + '/server/packager');
var cache            = require(paths.libdir + '/server/cache');
var statistics       = require(paths.libdir + '/server/stats');

var Exception415     = require(paths.libdir + '/exception/415');

/**
 *
 * @param err
 * @param originalRequest {http.IncomingMessage}
 * @param hapiReply {http.ServerResponse}
 * @param moduleRequest {moduleRequest}
 * @returns {Object}
 */
function moduleResponse (err, originalRequest, hapiReply, moduleRequest) {

	if (err) {
		return responseHandler(originalRequest, hapiReply, moduleRequest, err);
	}

	if (moduleRequest.timer) {
		moduleRequest.timer.push({requestReceived: +new Date()});
		moduleRequest.timer.push({requestProcessed: +new Date()});
	}

	if (moduleRequest.healthcheck) {
		statistics.out();
		return statusResponse(originalRequest, hapiReply, moduleRequest);
	}

	if (moduleRequest.redirect) {
		return redirectResponse(originalRequest, hapiReply, moduleRequest);
	}

	if (moduleRequest.invalid) {
		return responseHandler(originalRequest, hapiReply, moduleRequest, new Exception415(moduleRequest.pathname));
	}

	if (moduleRequest.cached) {
		return cachedResponse(originalRequest, hapiReply, null, moduleRequest);
	}

	async.waterfall([
		collector.bind(null, moduleRequest),
		pluginmanager.bind(null, moduleRequest),
		packager.bind(null, moduleRequest),
		cache.bind(null, moduleRequest)
	], responseHandler.bind(null, originalRequest, hapiReply, moduleRequest));

}

/**
 *
 * @param request {Hapi.request}
 * @param hapiReply {Hapi.reply}
 */
module.exports = function (request, hapiReply) {

	statistics.in();
	modulerequest(request, hapiReply, moduleResponse);

}
