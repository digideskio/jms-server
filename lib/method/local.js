var fs = require('graceful-fs');
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
	//console.log('read module ', chunk );

	var data = {
		file: this.basePath + chunk + '.js',
		module: chunk,
		source: false,
		deps: []
	}

	var stream = this;

	fs.readFile(data.file, function (err, source) {
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

	var result = Object.keys(modules).map(function (mod) {
		return modules[mod];
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

	var basePath = this.settings.app.codebase.sources[moduleRequest.source].root;

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

	input.on('data', function (data) {
		modules[data.module] = data;
	})

	parse.on('data', function (data) {
		data.dependencies.forEach(function (dep) {
			if (!modules[dep]) {
				count += 1
				input.write(dep)
			}
		})
		//console.log(count);
		
		if (count == 0) {
			createResult(modules, done)
		}
	});

	parse.on('parsed', function () {
		count -= 1
	})

	modulesToLoad.forEach(function (mod) {
		count += 1
		input.write(mod)
	})

}



/**
 * @scope Hapi.Server
 */
module.exports = localGetModules;