var Boom   = require('boom');

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

	return done(Boom.badImplementation('Storage read error: ' + ['source', moduleRequest.source, moduleRequest.stage].join(':')));
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
		return done(Boom.notFound('Cannot find the requested modules'));
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
		modulesToLoad,
		next
	);
}

/**
 * @scope Hapi.Server
 *
 * @param moduleRequest
 * @param modulesToLoad
 * @param done
 */
module.exports = function (moduleRequest, modulesToLoad, done) {

	if (this.settings.app.context.local) {
		return require('lib/method/local').call(this, moduleRequest, modulesToLoad, done);
	}

	getModules(this, moduleRequest, modulesToLoad, function (err, result) {
		if (err) {
			return storageError(err, moduleRequest, done);
		}
		return getValidResult(result, modulesToLoad.length, done);
	});

}