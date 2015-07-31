var _      = require('lodash');
var async  = require('async');
var Boom   = require('boom');

/**
 * @scope HapiRequest
 *
 * @param done
 */
function loadModules (done) {
;
	var moduleRequest = this.moduleRequest;

	if (moduleRequest.timer) {
		moduleRequest.timer.push({loadingModules: +new Date()});
	}

	var modulesToLoad = moduleRequest.include.concat(moduleRequest.exclude);

	this.server.methods.getModules(moduleRequest, modulesToLoad, function (err, result) {

		if (err) return done(Boom.notFound('cannot find modules'));

		done(null, result);
	});
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
			done(Boom.notFound('cannot find ' + name ));
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

	if (moduleRequest.timer) {
		moduleRequest.timer.push({loadingModuleDeps: +new Date()});
	}

	if (modulesToLoad.length == 0) {
		done(null, alreadyLoaded);
		return;
	}

	this.server.methods.getModules(moduleRequest, modulesToLoad, function (err, result) {

		if (err) return done(Boom.notFound('cannot find modules'));

		alreadyLoaded = result.concat(alreadyLoaded);

		done(null, alreadyLoaded);
	});

}


/**
 * @scope HapiRequest
 *
 * @param done
 */
module.exports = function collect (done) {

	async.waterfall([
		loadModules.bind(this),
		getModuleDeps.bind(this),
		loadModuleDeps.bind(this)
	], done);

}