var async      = require('async');

var collect    = require('lib/modules/collect');
var runPlugins = require('lib/pluginmanager/server');
var pack       = require('lib/modules/pack');

/**
 *
 * @param request {Hapi.request}
 * @param reply {Hapi.reply}
 *
 * @returns {Object}
 */
function responseHandler (request, reply) {

	var moduleRequest = request.moduleRequest;

	if (moduleRequest.redirect) {
		return require('lib/response/redirect')(request, reply);
	}

	if (moduleRequest.cached) {
		return require('lib/response/cached')(request, reply);
	}

	async.waterfall([
		collect.bind(request),
		runPlugins.bind(request),
		pack.bind(request)
	], require('lib/response/module').bind(null, request, reply));

}

/**
 *
 * @param request {Hapi.request}
 * @param reply {Hapi.reply}
 */
module.exports = responseHandler;
