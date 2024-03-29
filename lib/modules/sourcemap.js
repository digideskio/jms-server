var sourcemap = require('source-map');

var SourceMapConsumer = sourcemap.SourceMapConsumer,
	SourceMapGenerator = sourcemap.SourceMapGenerator;

/**
 * @scope HapiRequest
 *
 * @param moduleData
 * @param done
 */
function getSourceMap (moduleData, done) {

	var moduleRequest = this.moduleRequest;

	//todo we can do better
	var file = moduleRequest.url.path.replace('&sourceMap=1','');

	var generator = new SourceMapGenerator({
		file: file
	});

	// clientBundle also adds one line
	var lineOffset = moduleRequest.jmscb ? 1 : 0;

	moduleData.map(function (module) {

		var map = SourceMapConsumer(module.sourceMap);
		var currentSource = '';

		var lines = module.source.split('\n').length;

		map.eachMapping(function(mapping) {
			mapping = {
				generated: {
					line: mapping.generatedLine + lineOffset,
					column: mapping.generatedColumn
				},
				original: {
					line: mapping.originalLine,
					column: mapping.originalColumn
				},
				name: mapping.name,
				source: mapping.source
			};
			currentSource = mapping.source;
			return generator.addMapping(mapping);
		});

		generator.setSourceContent(currentSource, module.originalSource);

		lineOffset += lines;

	});

	done(null, generator.toString());
}

module.exports = getSourceMap;