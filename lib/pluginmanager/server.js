var PassThrough   = require('stream').PassThrough;
var streamCombine = require('stream-combiner');
var config        = require('jms-config');

var pluginList    = config.plugins;
var log           = require('lib/debug/log');
var errbit        = require('lib/debug/errbit')('server-plugins');

var serverPlugins = streamCombine(new PassThrough({ objectMode: true }));

pluginList.forEach(function (pluginData) {
	if (pluginData.enabled && pluginData.module) {
		try {
			var plugin = pluginData.module;
			if (plugin.server) {
				var pluginInstance = new plugin.server({ objectMode: true }, pluginData.options);
				pluginInstance.setEncoding('utf8');
				serverPlugins = streamCombine(serverPlugins, pluginInstance);
			}
		} catch (e) {}
	}
});

serverPlugins.on('error', function (err) {
	errbit.notify(err);
});

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
