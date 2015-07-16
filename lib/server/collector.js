var _              = require('lodash');
var async          = require('async');

var Boom = require('boom');


var paths          = require('../../lib/paths');

var errbit         = require(paths.libdir + '/debug/errbit')('module-collector');

/**
 *
 * @param done
 */
function loadModules (done) {

	var request = this;
	var moduleRequest = this.moduleRequest;

	if (moduleRequest.timer) {
		moduleRequest.timer.push({loadingModules: +new Date()});
	}

	var m = moduleRequest.include.concat(moduleRequest.exclude),
		moduleList = [];

	fetchModules.call(request, m, moduleList, done);
}



/**
 * collect all module names by the transitive dependencies of the given apps
 *
 * @param {Array} what app list
 * @param {Object} modules modules collection
 * @returns {Array} modules list
 */
function collectModules (what, modules, onerror) {
	var returnSum = [];
	var len = what.length;

	for (var i = 0 ; i < len ; i++) {
		
		var name = what[i],
			m;

		m = _.find(modules, {module: name});

		if (!m) {
			onerror(Boom.notFound('cannot find ' + name ));
			return;
		}

		returnSum = returnSum.concat(m.transitive_dependencies);
		returnSum.push(name);
	}

	return _.uniq(returnSum);
}


/**
 *
 * @param done
 * @param moduleRequest
 * @param moduleList
 */
function parseModuleDeps (moduleRequest, moduleList, done) {

	if (moduleList.indexOf(null) > -1) {
		done(Boom.notFound('cannot find modules'));
		return;
	}

	if (moduleRequest.timer) {
		moduleRequest.timer.push({parsingModuleDeps: +new Date()});
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

	_.remove(modulesToLoad, function (module) {
		return !!_.find(alreadyLoaded, { module: module });
	});

	done(null, moduleRequest, modulesToLoad, alreadyLoaded);
}


/**
 *
 * @param modules
 * @param moduleList
 * @param done
 */
function fetchModules (modules, moduleList, done) {
	
	var moduleRequest = this.moduleRequest;

	this.server.methods.storage(
		'getmodules',
		moduleRequest.source,
		moduleRequest.stage,
		modules,
		function (err, result) {
			if (err) {
				console.log(err );

				err.params =  {
					request: moduleRequest
				};
				errbit.notify(err);

				return done(Boom.badImplementation('read error: ' + ['source', moduleRequest.source, moduleRequest.stage].join(':')));
			}

			if (!result.push) {
				result = [result];
			}

			var moduleList = result.map(JSON.parse);

			if (moduleList.length < modules.length) {
				return done(Boom.notFound('cannot find modules'));

			}

			done(null, moduleRequest, moduleList);
		}
	);

}



/**
 *
 * @param moduleRequest
 * @param modulesToLoad
 * @param alreadyLoaded
 * @param done
 */
function loadModuleDeps (moduleRequest, modulesToLoad, alreadyLoaded, done) {

	if (moduleRequest.timer) {
		moduleRequest.timer.push({loadingModuleDeps: +new Date()});
	}

	if (modulesToLoad.length == 0) {
		done(null, alreadyLoaded);
		return;
	}

	this.server.methods.storage(
		'getmodules',
		moduleRequest.source,
		moduleRequest.stage,
		modulesToLoad,
		function (err, result) {

			if (err) {
				done(Boom.badImplementation('read error: ' + ['source', moduleRequest.source, moduleRequest.stage].join(':')));
				return;
			}

			if (!result.push) {
				result = [result];
			}

			var moduleList = result.map(JSON.parse);

			if (moduleList.length < modulesToLoad.length) {
				done(Boom.notFound('cannot find modules'));
				return;
			}

			alreadyLoaded = moduleList.concat(alreadyLoaded);

			done(null, alreadyLoaded);
		}
	);
}

/**
 *
 * @param moduleRequest
 * @param done
 */
module.exports = function (done) {

	var moduleRequest = this.moduleRequest;

	async.waterfall([
		loadModules.bind(this),
		parseModuleDeps.bind(this),
		loadModuleDeps.bind(this)
	], done);

}
