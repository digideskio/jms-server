var _      = require('lodash');
var async  = require('async');
var Boom   = require('boom');

/**
 * @scope HapiRequest
 *
 * @param done
 */
function loadModules (done) {

	var moduleRequest = this.moduleRequest;

	var modulesToLoad = moduleRequest.include.concat(moduleRequest.exclude);

	getModules.call(this, moduleRequest, modulesToLoad, function (err, result) {
		if (err) return done(Boom.notFound('Cannot find modules to load (' + modulesToLoad.join('') + ')'));

		done(null, result);
	});
}


/**
 * @scope HapiRequest
 * 
 * @method getClient
 */
function getClient (moduleList, done) {
	var moduleRequest = this.moduleRequest;
	var request = this;

	if (moduleList.indexOf(null) > -1) {
		return done(null, moduleList);
	}

	if (moduleList[0]) {
		moduleRequest.source = moduleList[0].sourceId;
		moduleRequest.stage = moduleList[0].stage;
	}

	if (!moduleRequest.prependClient) {
		return done(null, moduleList);
	}

	this.server.methods.storage(
		'getMap',
		moduleRequest.source,
		moduleRequest.stage,
		['jms/client'],
		function (err, result) {
			if (err || result.indexOf(null) > -1) return done(Boom.notFound('Cannot find client to load'));

			moduleRequest.client = result[0];

			done(null, moduleList);
		}
	);
}



/**
 * collect all module names by the transitive dependencies of the given apps
 *
 * @param {Array} what app list
 * @param {Object} modules modules collection
 * @param {Function} done
 * @returns {*} modules list
 */
function collectModules (what, modules, done) {
	var returnSum = [];
	var len = what.length;

	for (var i = 0 ; i < len ; i++) {
		
		var name = what[i],
			m;

		m = _.find(modules, {module: name});

		if (!m) {
			done(Boom.notFound('Cannot find ' + name ));
			return;
		}

		returnSum = returnSum.concat(m.transitive_dependencies);
		returnSum.push(name);
	}

	return _.uniq(returnSum);
}

/**
 * @scope HapiRequest
 *
 * @param done
 * @param moduleRequest
 * @param moduleList
 */
function getModuleDeps (moduleList, done) {

	var moduleRequest = this.moduleRequest;

	if (moduleList.indexOf(null) > -1) {
		done(Boom.notFound('Cannot find modules, requested module list is empty'));
		return;
	}

	// included stuff
	var includeSum = collectModules(moduleRequest.include, moduleList, done);

	// excluded stuff
	var excludeSum = collectModules(moduleRequest.exclude, moduleList, done);

	// trim loaded modules we dont want to serve
	var alreadyLoaded = _.filter(moduleList, function (module) {
		return moduleRequest.include.indexOf(module.module) > -1;
	});

	// trim modules from list that we already loaded
	var modulesToLoad = _.difference(includeSum, excludeSum);

	// add the client to the modules about to be loaded
	if (moduleRequest.prependClient) {
		modulesToLoad.unshift(moduleRequest.client)
	}

	_.remove(modulesToLoad, function (module) {
		return !!_.find(alreadyLoaded, { module: module });
	});

	done(null, modulesToLoad, alreadyLoaded);
}

/**
 * @scope HapiRequest
 *
 * @param {Array} modulesToLoad
 * @param {Array} alreadyLoaded
 * @param {Function} done
 */
function loadModuleDeps (modulesToLoad, alreadyLoaded, done) {
	var moduleRequest = this.moduleRequest;

	if (modulesToLoad.length == 0) {
		done(null, alreadyLoaded);
		return;
	}

	getModules.call(this, moduleRequest, modulesToLoad, function (err, result) {

		if (err) return done(Boom.notFound('Cannot find module dependencies ('+ modulesToLoad.join(',') +')'));

		alreadyLoaded = result.concat(alreadyLoaded);

		done(null, alreadyLoaded);
	});

}

function getModules (moduleRequest, modulesToLoad, done) {
	this.server.methods.getModules(moduleRequest, modulesToLoad, done);
}

/**
 * @scope Hapi.Request
 *
 * @param done
 */
module.exports = function collect (done) {

	var request = this;

	if (this.server.settings.app.context.local) {

		var moduleRequest = this.moduleRequest;

		var excluded = [],
			included = [];

		getModules.call(request, moduleRequest, moduleRequest.include, function (err, result) {
			if (err) return done(Boom.create( err instanceof SyntaxError ? 422: 404, err));

			included = result;

			getModules.call(request, moduleRequest, moduleRequest.exclude, function (err, result) {
				if (err) return done(Boom.create( err instanceof SyntaxError ? 422: 404, err));

				excluded = result;

				var modulesToLoad = included.filter(function (inc) {
					return !_.find(excluded, {module: inc.module});
				});

				if (moduleRequest.prependClient) {
					return getModules.call(request, moduleRequest, ['jms/client'], function (err, result) {

						modulesToLoad.unshift(result[0])
						done(null, modulesToLoad);

					})
				}


				done(null, modulesToLoad);
			});
		});

	} else {
		async.waterfall([
			loadModules.bind(request),
			getClient.bind(request),
			getModuleDeps.bind(request),
			loadModuleDeps.bind(request)
		], done);
	}


}
