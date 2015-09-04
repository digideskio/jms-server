var _     = require('lodash');
var async = require('async');


function wrapQuotes (item) {
	return '"' + item + '"';
}

function makeInvoke (item) {
	return item + '()'
}

function makeArg (item) {
	return 'a'+item.replace('/','_')
}

function noClient (client, module) {
	return client.module !== module;
}

function createConfig (moduleRequest) {

	var cfg = {
		baseURL: '//' + moduleRequest.headers.host,
		source: moduleRequest.source,
		stage: moduleRequest.stage,
		params: _.omit(moduleRequest.params, 'client')
	};

	if (moduleRequest.localContext) {
		cfg.localContext = true;
	}

	return '(function(){jms = ' + JSON.stringify(cfg) + '}())';
}

/**
 * @param {string} str
 * @return {string}
 */
function sanitizeSingleLineComment(str) {
	return str.replace(/[\n\r\u2028\u2029]/g, '');
}

function getDebugSource (moduleData) {
	return _.map(moduleData, function (module) {
		var src = module.source;
		var file = sanitizeSingleLineComment(module.path).replace(/^\//, '');
		var url = 'jms://' + file;

		src += '\n//# sourceURL=' + url;
		src += '\n//@ sourceURL=' + url;

		src = 'eval(' + JSON.stringify(src) + ');\n';
		src = 'try{' + src + '}catch(e){if(!e.fileName)e.message+=' +
			JSON.stringify(' ' + url) + ';throw e}\n\n';

		return src;
	})
}


/**
 *
 * @param {Array} source
 */
function contextWrap (source) {

	source.unshift('(function jmsContext(){');
	source.push('}())');

	return source;


}

/**
 * @scope Hapi.Request
 *
 * @param moduleData
 * @param done
 * @param moduleRequest
 */
function getSource (moduleData, done) {

	var moduleRequest = this.moduleRequest;
	var localContext = moduleRequest.localContext;

	var source = moduleRequest.debug && localContext ? getDebugSource(moduleData) : _.pluck(moduleData, 'source');

	if (moduleRequest.prependClient) {

		var includes = moduleRequest.include;

		source.unshift(createConfig(moduleRequest));

		var invocation = [
			'require([',
				includes.map(wrapQuotes).join(','),
			'], function (',
				includes.map(makeArg).join(','),
			') {',
				'jms.push([' ,
				includes.map(wrapQuotes).join(','),
				']);'
		];

		if (moduleRequest.callInit) {
			invocation.push(['window.',moduleRequest.callInit,'(',includes.map(makeArg).join(','),');'].join(''));
		} else {
			invocation.push(includes.map(makeArg).map(makeInvoke).join(';'));
		}
		invocation.push('})');

		source.push(invocation.join(''));

		/*
			multiple clients can coexist next to each other on a page
			need a require/define scope for each one
			smtg like this http://requirejs.org/docs/api.html#multiversion
		 */

		if (moduleRequest.prependClient && moduleRequest.multiClient) {
			source = contextWrap(source);
		}
	}

	if (moduleRequest.debug) {
		moduleRequest.originalRes = _.pluck(moduleData, 'originalModule');
		moduleRequest.originalReq = _.pluck(_.filter(moduleData, function (module) {
			return moduleRequest.include.indexOf(module.module) > -1;
		}), 'originalModule');
	}

	done(null, source.join(';'+'\n'));
}

/**
 * @scope Hapi.Request
 *
 * @param moduleRequest
 * @param source
 * @param done
 */
function ordered (source, done) {

	var moduleRequest = this.moduleRequest;
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
				'ret.payload = function (__jmsctx) {',
					'var define = __jmsctx.define,',
						'require = __jmsctx.require,',
						'requirejs = __jmsctx.requirejs,',
						'jms = __jmsctx.jms;',
					"\n",
					source,
				"\n",
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
 * @scope Hapi.Request
 *
 * @param moduleData
 * @param source
 * @param done
 */
function prepare (moduleData, source, done) {

	var moduleRequest = this.moduleRequest;
	var localContext = moduleRequest.localContext;
	var mtimes = _.pluck(moduleData, 'mtime');


	if (!localContext) {
		var sourcemapUrl = moduleRequest.url.path + (
				moduleRequest.url.path.indexOf('?') < 0 ? '?' : '&'
			) + 'sourceMap=1';

		source += "\n" + '//# sourceMappingURL=' + sourcemapUrl;
		source += '\n';
	}

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
 * @scope Hapi.Request
 *
 * @param moduleData
 * @param done
 */
module.exports = function pack (moduleData, done) {

	var moduleRequest = this.moduleRequest;

	if (moduleRequest.params.sourceMap) {
		async.waterfall([
			require('lib/modules/sourcemap').bind(this, moduleData),
			prepare.bind(this, moduleData)
		], done);
	} else {
		async.waterfall([
			getSource.bind(this, moduleData),
			ordered.bind(this),
			prepare.bind(this, moduleData)
		], done);
	}
}
