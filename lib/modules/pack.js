var _     = require('lodash');
var async = require('async');


function wrapQuotes (item) {
	return '"' + item + '"';
}

function makeInvoke (item) {
	return item + '()'
}

function makeArg (item) {
	return item.replace('/','_')
}

function noClient (client, module) {
	return client.module !== module;
}

/**
 *
 * @param moduleData
 * @param done
 * @param moduleRequest
 */
function getSource (moduleData, moduleRequest, done) {

	if (moduleRequest.prependClient) {
		var client = _.find(moduleData, {originalModule: 'jms/client'});
		moduleData = _.reject(moduleData, {originalModule: 'jms/client'});
	}

	var source = _.pluck(moduleData, 'source');

	if (moduleRequest.prependClient) {

		var includes = moduleRequest.include.filter(_.curry(noClient)(client));
		source.unshift(client.source);
		source.push([
			'require([',
				includes.map(wrapQuotes).join(','),
			'], function (',
				includes.map(makeArg).join(','),
			') {',
				'window.jms.push([' ,
				includes.map(wrapQuotes).join(','),
				']);',
				includes.map(makeArg).map(makeInvoke).join(';'),
			'})'
		].join(''));
	}

	if (moduleRequest.debug) {
		moduleRequest.originalRes = _.pluck(moduleData, 'originalModule');
		moduleRequest.originalReq = _.pluck(_.filter(moduleData, function (module) {
			return moduleRequest.include.indexOf(module.module) > -1;
		}), 'originalModule');
	}

	done(null, source.join(';'));
}

/**
 *
 * @param moduleRequest
 * @param source
 * @param done
 */
function ordered (moduleRequest, source, done) {

	var manifest;

	if (moduleRequest.debug) {
		manifest = {
			requested: moduleRequest.originalReq,
			received: moduleRequest.originalRes
		};
	}

	if (moduleRequest.jmscb) {
		source = [
			'window["',
			moduleRequest.jmscb,
			'"] = function() { ' ,
				'var ret = {};' ,
				'ret.payload = function () {',
					source,
				'};' ,
				moduleRequest.debug ? 'ret.manifest=\' ' + JSON.stringify(manifest) + '\';' : '',
				'ret.list="',
					moduleRequest.include.join('|'),
				'";' ,
				'return ret;',
			'};'
		].join('');
	}

	done(null, source);
}

/**
 *
 * @param modulerequest
 * @param source
 * @param done
 */
function prepare (moduleData, source, done) {

	var mtimes = _.pluck(moduleData, 'mtime');

	source += '\n';

	// package lastModified date

	var lastModified = new Date(0);
	for (var t = 0, mLen = mtimes.length; t < mLen ; t++) {
		mtimes[t] = new Date(mtimes[t]);

		if (mtimes[t].getTime() > lastModified.getTime()) {
			lastModified = mtimes[t];
		}
	}

	var byteLength = Buffer.byteLength(source, 'utf8');

	done(null, source, byteLength, lastModified);

}

/**
 *
 * @param moduleData
 * @param done
 */
module.exports = function pack (moduleData, done) {

	var moduleRequest = this.moduleRequest;

	if (moduleRequest.timer) {
		moduleRequest.timer.push({preparePackage: +new Date()});
	}

	async.waterfall([
		getSource.bind(null, moduleData, moduleRequest),
		ordered.bind(null, moduleRequest),
		prepare.bind(null, moduleData)
	], done);
}
