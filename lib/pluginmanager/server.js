var PassThrough   = require('stream').PassThrough;
var streamCombine = require('stream-combiner');

/**
 * @scope Hapi.Request
 *
 * @param config
 * @returns {*}
 */
function init (config) {

	var server = this.server;
	var pluginList    = config.plugins;
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
		server.log(['error', 'storage'], err);
		throw err;
	});

	return serverPlugins;
}

/**
 *
 * function to be inserted in an async.waterfall
 *
 * @scope Hapi.Request
 *
 * @param moduleData
 * @param done
 * @constructor
 */
function ServerRunner (moduleData, done) {

	var serverPlugins = init.call(this, this.server.settings.app);

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
