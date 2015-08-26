var _    = require('lodash');
var Boom = require('boom');

var ModuleRequestObject = {
	//build: 1,
	cached: false,
	debug: false,
	redirect: false,
	jmscb: false,
	source: 'live',
	stage: 'live',
	include: [],
	exclude: [],
	invalid: false,
	prependClient: false,
	localContext: false
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
 * @param reply {http.ServerResponse}
 * @param moduleRequest
 * @param err
 * @param exists
 * @returns {*}
 */
function ifRequestExists (reply, moduleRequest, err, value, cached) {

	var request = this;

	if (value !== null) {

		this.server.log(['verbose','modulerequest'], 'has cache for ' + moduleRequest.href);

		moduleRequest.cached = true;
		moduleRequest.response = JSON.parse(value);

		request.moduleRequest = moduleRequest;
		return reply.continue();
	}

	setupRequest(request, reply, moduleRequest);
}

/**
 *
 * @param request
 * @param reply
 * @param moduleRequest
 * @returns {*}
 */
function setupRequest (request, reply, moduleRequest) {

	var path = moduleRequest.pathname;
	var params = {};

	var parsedModuleRequest = request.params.modules.replace('.js','').match(/\+([a-zA-Z0-9\/,_]*)-?([a-zA-Z0-9\/,_]*)?/i);

	request.moduleRequest = moduleRequest;

	if (!parsedModuleRequest) {
		moduleRequest.invalid = true;
		return reply(Boom.badRequest('Missing modules to include, usage: "+included-excluded"'));
	}

	params = moduleRequest.params;

	moduleRequest.debug = !!params.debug || ModuleRequestObject.debug;
	moduleRequest.jmscb = params.cb || ModuleRequestObject.jmscb;
	moduleRequest.include = extract_modules(parsedModuleRequest[1]);
	moduleRequest.exclude = extract_modules(parsedModuleRequest[2]);


	if (moduleRequest.include.length < 1) {
		return reply(Boom.badRequest('Missing modules to include'));
	}

	if (request.server.settings.app.context.local) {
		return reply.continue();
	}


	if (!moduleRequest.source && !moduleRequest.stage) {
		return reply.continue();
	}

	// 302 redirect kell e vagy mar hashelt keres
	//	storage.get(request.href, ifRequestExists.bind(null, done, request));
	// de ezt az osszes included es excluded keresre
	// ha mindegyik unhashed akkor jo, tudunk ra hashelt verzion kuldeni
	// egyeb esetben 404

	var modulelist = moduleRequest.include.concat(moduleRequest.exclude);

	request.server.methods.storage(
		'getMap',
		moduleRequest.source,
		moduleRequest.stage,
		modulelist,
		onMapResult.bind(null, request, reply, moduleRequest)
	);
}

/**
 *
 * @param request
 * @param reply
 * @param moduleRequest
 * @param err
 * @param result
 * @returns {*}
 */
function onMapResult (request, reply, moduleRequest, err, result) {

	var compactResult = _.compact(result)

	if (compactResult.length === 0) {
		// normal request using already hashed modules
		request.moduleRequest = moduleRequest;
		return reply.continue();
	}

	if (result.indexOf(null) > -1) {
		// 404
		return reply(Boom.notFound('One of the requested  modules is missing a hash'));
	} else {

		// 302
		moduleRequest.redirect = true;
		moduleRequest.include = result.slice(0, moduleRequest.include.length);
		moduleRequest.exclude = result.slice(moduleRequest.include.length);

		request.moduleRequest = moduleRequest;

		return reply.continue();
	}

}

/**
 *
 * @param originalRequest
 * @param hapiReply
 * @returns {*}
 * @constructor
 */
function ModuleRequest (server, options, next) {

	var cache = server.cache({ segment: 'modules', expiresIn: 24 * 60 * 60 * 1000 });

	server.ext('onPreHandler', function (request, reply) {
		if (
			!request.params ||
			!request.params.modules
		) {
			return reply.continue();
		}

		var moduleRequest = clone(ModuleRequestObject);
		var url = request.url;

		moduleRequest.url = url;
		moduleRequest.href = url.href;
		moduleRequest.pathname = url.path;
		moduleRequest.headers = request.headers;
		moduleRequest.remoteAddress = request.info.remoteAddress;

		if (!request.params) {
			return reply(Boom.badRequest());
		}

		moduleRequest.params = request.query;
		moduleRequest.prependClient = !!moduleRequest.params.client;

		moduleRequest.source = request.params.source;
		moduleRequest.stage = request.params.stage;

		if (request.server.settings.app.context.local) {
			moduleRequest.localContext = true;
			return setupRequest(request, reply, moduleRequest)
		}

		cache.get(moduleRequest.href, ifRequestExists.bind(request, reply, moduleRequest));
	});

	return next();
}

ModuleRequest.attributes = {
	pkg: {
		"name": "modulerequest",
		"version": "1.0.0",
		"description": "module request parsing hapijs plugin for jm-server"
	}
}

module.exports = ModuleRequest;