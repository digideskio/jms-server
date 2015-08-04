var Boom   = require('boom');
var errbit = require('lib/debug/errbit')('module-collector');

/**
 *
 * @param {Object} err
 * @param {Object} moduleRequest
 * @param {Function} done
 *
 * @returns {*}
 */
function storageError (err, moduleRequest, done) {
	console.log(err);

	err.params =  {
		request: moduleRequest
	};
	errbit.notify(err);

	return done(Boom.badImplementation('read error: ' + ['source', moduleRequest.source, moduleRequest.stage].join(':')));
}

/**
 *
 * @param {Array} result
 * @param {Number} count
 * @param {Function} done
 *
 * @returns {*}
 */
function getValidResult (result, count, done) {

	if (!result.push) {
		result = [result];
	}

	var moduleList = result.map(JSON.parse);

	if (moduleList.length < count) {
		return done(Boom.notFound('cannot find modules'));
	}

	return done(null, moduleList);

}

/**
 *
 * @param server
 * @param moduleRequest
 * @param modulesToLoad
 * @param next
 */
var getModules = function (server, moduleRequest, modulesToLoad, next) {
	server.methods.storage(
		'getModules',
		moduleRequest.source,
		moduleRequest.stage,
		modulesToLoad,
		next
	);
}

/**
 * @scope server
 *
 * @param moduleRequest
 * @param modulesToLoad
 * @param done
 */
module.exports = function (moduleRequest, modulesToLoad, done) {

	if (this.settings.app.context.local) {
		return require('lib/method/local').call(this, modulesToLoad, done);
	}

	getModules(this, moduleRequest, modulesToLoad, function (err, result) {
		if (err) {
			return storageError(err, moduleRequest, done);
		}

		return getValidResult(result, modulesToLoad.length, done);
	});

}