var Url          = require('url');
var _            = require('lodash');
var config       = require('jms-config');

var Boom = require('boom');


var paths        = require('../../lib/paths');
var netConf      = config.network;
var debugConf    = config.debug;

var storage      = require(paths.libdir + '/storage');
var log          = require(paths.libdir + '/debug/log');


var Exception415 = require(paths.libdir + '/exception/415');
var Exception404 = require(paths.libdir + '/exception/404');
var Exception400 = require(paths.libdir + '/exception/400');

var ModuleRequestObject = {
	//build: 1,
	debug: false,
	redirect: false,
	jmscb: false,
	source: 'live',
	stage: 'live',
	include: [],
	exclude: [],
	invalid: false,
	client: false
}


/**
 *
 * @param obj
 * @returns {*}
 */
function clone(obj) {
	// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;

	// Handle Date
	if (obj instanceof Date) {
		var copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}

	// Handle Array
	if (obj instanceof Array) {
		var copy = [];
		for (var i = 0, len = obj.length; i < len; i++) {
			copy[i] = clone(obj[i]);
		}
		return copy;
	}

	// Handle Object
	if (obj instanceof Object) {
		var copy = {};
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
		}
		return copy;
	}

}

/**
 * extract a module list from url fragments
 *
 * @param from {String}
 * @returns {Array}
 */
function extract_modules (from) {
	if (from) {
		from = from.replace('.js', '').replace('.map', '');
	}
	var extracted = from ? from.split(',') : [];
	return extracted;
}

/**
 *
 * @param done
 * @param originalRequest {http.IncomingMessage}
 * @param httpResponse {http.ServerResponse}
 * @param moduleRequest
 * @param err
 * @param exists
 * @returns {*}
 */
function ifRequestExists (done, originalRequest, httpResponse, moduleRequest, err, exists) {

	if (moduleRequest.timer) {
		moduleRequest.timer.push({doneCacheSearch: +new Date()});
	}

	if (exists.indexOf(null) < 0) {

		log.verbose('ModuleRequest', 'has cache for ' + moduleRequest.href);

		moduleRequest.cached = true;
		moduleRequest.response = JSON.parse(exists);

		if (moduleRequest.timer) {
			moduleRequest.timer.push({gotCachedResponse: +new Date()});
		}

		return done(null, originalRequest, httpResponse, moduleRequest);
	}

	setupRequest(originalRequest, httpResponse, moduleRequest, done);
}

/**
 *
 * @param originalRequest
 * @param httpResponse
 * @param moduleRequest
 * @param done
 * @returns {*}
 */
function setupRequest (originalRequest, httpResponse, moduleRequest, done) {

	var path = moduleRequest.pathname;
	var params = {};

	var parsedModuleRequest = originalRequest.params.modules.replace('.js','').match(/\+([a-zA-Z0-9\/,_]*)-?([a-zA-Z0-9\/,_]*)?/i);

	if (!parsedModuleRequest) {
		moduleRequest.invalid = true;
		return done(Boom.badRequest('Missing modules to include, usage: "+included-excluded"'), originalRequest, httpResponse, moduleRequest);
	}

	moduleRequest.params= params = originalRequest.query;

	moduleRequest.debug = !!params.debug || ModuleRequestObject.debug;

	moduleRequest.jmscb = params.cb || ModuleRequestObject.jmscb;

	moduleRequest.include = extract_modules(parsedModuleRequest[1]);

	moduleRequest.exclude = extract_modules(parsedModuleRequest[2]);


	if (moduleRequest.include.length < 1) {
		return done(Boom.badRequest('Missing modules to include'), originalRequest, httpResponse, moduleRequest);
	}

	// 302 redirect kell e vagy mar hashelt keres
	//	storage.get(request.href, ifRequestExists.bind(null, done, request));
	// de ezt az osszes included es excluded keresre
	// ha mindegyik unhashed akkor jo, tudunk ra hashelt verzion kuldeni
	// egyeb esetben 404

	var modulelist = moduleRequest.include.concat(moduleRequest.exclude);

	storage.hmget(
		['map', moduleRequest.source, moduleRequest.stage].join(':'),
		modulelist,
		onMapResult
			.bind(null, originalRequest, httpResponse, moduleRequest, done)
	);

}

/**
 *
 * @param originalRequest
 * @param httpResponse
 * @param moduleRequest
 * @param done
 * @param err
 * @param result
 * @returns {*}
 */
function onMapResult (originalRequest, httpResponse, moduleRequest, done, err, result) {

	if (moduleRequest.timer) {
		moduleRequest.timer.push({requestSetupDone: +new Date()});
	}

	if (_.compact(result).length === 0) {
		// normal request using already hashed modules
		return done(null, originalRequest, httpResponse, moduleRequest);
	}

	if (result.indexOf(null) > -1) {
		// 404
		return done(Boom.notFound('Missing module'), originalRequest, httpResponse, moduleRequest);
	} else {
		// 302
		moduleRequest.redirect = true;
		moduleRequest.include = result.slice(0, moduleRequest.include.length);
		moduleRequest.exclude = result.slice(moduleRequest.include.length);
		return done(null, originalRequest, httpResponse, moduleRequest);
	}

}

/**
 *
 * @param originalRequest
 * @param hapiReply
 * @param done
 * @returns {*}
 * @constructor
 */
function ModuleRequest (originalRequest, hapiReply, done) {


	var moduleRequest = clone(ModuleRequestObject);
	var url = originalRequest.url;

	moduleRequest.url = url;
	moduleRequest.href = url.href;
	moduleRequest.pathname = url.path;
	moduleRequest.headers = originalRequest.headers;
	moduleRequest.remoteAddress = originalRequest.info.remoteAddress;


	// set up debugging timer
	if (debugConf.timer) {
		moduleRequest.timer = [];
	}

	if (originalRequest.params.modules === 'jmsclient.js') {
		moduleRequest.client = true;
		moduleRequest.include.push('jmsclient');
		return done(null, originalRequest, hapiReply, moduleRequest);
	}

	// from which repo
	var sourceRequest = originalRequest.params.source;

	if (!sourceRequest) {
		return done(Boom.badRequest('Missing module source information'), originalRequest, hapiReply, moduleRequest);
	}

	moduleRequest.source = originalRequest.params.source;
	moduleRequest.stage = originalRequest.params.stage;

	// has cached response or else
	if (netConf.cache) {
		storage.hmget(
			['cache', moduleRequest.source,moduleRequest.stage].join(':'),
			[moduleRequest.href],
			ifRequestExists.bind(null, done, originalRequest, hapiReply, moduleRequest)
		);
	} else {
		setupRequest(originalRequest, hapiReply, moduleRequest, done);
	}

}

module.exports = ModuleRequest;