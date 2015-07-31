var Transform     = require('stream').Transform;
var PassThrough   = require('stream').PassThrough;
var util          = require('util');
var streamCombine = require('stream-combiner');
var config        = require('jms-config');


var pluginConfigs = config.plugins;
var log           = require('lib/debug/log');
var errbit        = require('lib/debug/errbit')('server-plugins');

var serverPlugins = streamCombine(new PassThrough({ objectMode: true }));

var pluginConf;

for (var pgin in pluginConfigs) {

	pluginConf = pluginConfigs[pgin];

	if (pluginConf.enabled) {
		try {
			var plug = require('plugins/' + pluginConf.name);
			if (plug.server) {
				var plugin = new plug.server({ objectMode: true }, pluginConf.options);
				plugin.setEncoding('utf8');
				serverPlugins = streamCombine(serverPlugins, plugin);
			}
		} catch (e) {}
	}
}

serverPlugins.on('error', function (err) {

	err.params =  {
		config: pluginConfigs
	};
	errbit.notify(err);

})

/**
 *
 * function to be inserted in an async.waterfall
 *
 * @param moduleData
 * @param done
 * @constructor
 */
function ServerRunner (moduleData, done) {

	var moduleRequest = this.moduleRequest;

	if (moduleRequest.timer) {
		moduleRequest.timer.push({runningPlugins: +new Date()});
	}

	serverPlugins.once('data', function serverPluginDataOnce (data) {
		var modules = JSON.parse(data).modules;
		done(null, modules);
	});
	serverPlugins.write(JSON.stringify({
		request: moduleRequest,
		modules: moduleData
	}));
}

module.exports = ServerRunner;
