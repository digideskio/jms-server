var fs = require('graceful-fs');
var _ = require('lodash');
var depStream  = require('lib/method/dep-stream');

var Writable   = require('stream').Writable;
var Transform   = require('stream').Transform;
var util       = require('util');

function Input (options) {
	Transform.call(this, options);
	this.basePath = options.basePath;

	if (this.basePath.slice(-1) !== '/') {
		this.basePath += "/";
	}
}

util.inherits(Input, Transform);

Input.prototype._transform  = function (chunk, encoding, done) {
	var that = this;

	var data = {
		path: this.basePath + chunk + '.js',
		originalModule: chunk,
		module: chunk,
		source: false,
		deps: []
	}

	var stream = this;

	fs.readFile(data.path, function (err, source) {

		if (err) return that.emit('error', new SyntaxError('File not found: ' + data.path));

		data.source = source.toString();
		stream.push(data);
	});

	done();
}

function Parse (options) {
	Transform.call(this, options);
}

util.inherits(Parse, Transform);

Parse.prototype._transform = function (chunk, encoding, done) {
	this.emit('parsed');
	this.push(chunk);
	done();
}


function createResult (modules, done) {
	var data = Object.keys(modules).map(function (mod) {
		return modules[mod];
	});


	var ordered = [];
	var result = [];

	var iterate = function (moduleName) {
		var module = _.find(data, {'originalModule': moduleName});
		ordered.unshift(module.originalModule);

		if (ordered.indexOf(module.originalModule) > -1) return;
		module.dependencies.forEach(iterate);
	}

	data.forEach(function(module) {
		ordered.unshift(module.originalModule);
		module.dependencies.forEach(iterate);
	});

	ordered = _.uniq(ordered);
	ordered.forEach(function (module) {
		result.push(_.find(data, {'originalModule': module}))
	});

	done(null, result);
}

/**
 * @scope Hapi.Server
 *
 * @param moduleRequest
 * @param modulesToLoad
 * @param done
 */
function localGetModules (moduleRequest, modulesToLoad, done) {

	if (modulesToLoad.length === 0) {
		done(null, []);
	}

	var basePath = this.settings.app.codebase.source[moduleRequest.source].root;

	var input = new Input({
		objectMode: true,
		basePath: basePath
	})
	var parseDeps = new depStream({objectMode: true});
	var parse = new Parse({objectMode: true});

	input
		.pipe(parseDeps)
		.pipe(parse)

	var modules = {}
	var count = 0

	input.on('error', function (e) {
		done(e)
	});
	parseDeps.on('error', function (e) {
		done(e)
	});

	parse.on('data', function (data) {

		count -= 1;

		if (!data) return;

		if (!modules[data.module]) modules[data.module] = data;

		data.dependencies.forEach(function (dep) {
			if (!modules[dep]) {
				count += 1
				input.write(dep)
			}
		});

		if (count == 0) {
			createResult(modules, done)
		}
	});

	modulesToLoad.forEach(function (mod) {
		count += 1
		input.write(mod)
	})


}



/**
 * @scope Hapi.Server
 */
module.exports = localGetModules;