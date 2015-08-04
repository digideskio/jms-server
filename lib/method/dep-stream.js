var Transform = require('stream').Transform;
var util      = require('util');

var _         = require('lodash');
var esprima   = require('esprima');
var escodegen = require('escodegen');
var traverse  = require("estraverse");


/**
 *
 * @param moduleData
 * @returns {*}
 * @constructor
 */
function ESfindDependencies (moduleData) {

	var module = moduleData.module;

	try {
		var ast = esprima.parse(moduleData.source);
	} catch (e) {
		throw new SyntaxError(['Line ', e.lineNumber, ': ', e.description, ' in file ', moduleData.path].join(''));
	}

	moduleData.dependencies = [];
	moduleData.requirecalls = [];

	var define = false;
	var updatedDefine = false;

	// has define
	//		has module name
	//			use module name
	//		 no module name
	//			give module name
	// no define

	traverse.traverse(ast, {
		enter: function(node, parent, prop, idx) {

			if (node.type === "CallExpression" &&
				node.callee.name === 'define'
			) {

				define = true;

				var depList = node.arguments[0];

				if (node.arguments.length > 2) {
					// has module name
					moduleData.module = node.arguments[0].value;
					depList = node.arguments[1];
				} else {
					// no module name yet
					updatedDefine = true;
					node.arguments.unshift({
						type: 'Literal',
						value: module,
						raw: '"' + escape(module) + '"'
					});
				}

				if (!depList.elements) {
					depList.elements = [];
					//throw('Invalid module definition, dependencies missing');
				}

				depList.elements.forEach(function (arrayItem) {
					if (['require', 'exports', 'module'].indexOf(arrayItem.value) < 0) {
						//moduleData.dependencies.unshift(arrayItem.value);
						moduleData.dependencies.push(arrayItem.value);
					}
				});
			}

			if (node.type === "CallExpression" &&
				node.callee.name === 'require'
			) {
				if (node.arguments && node.arguments[0].type === 'ArrayExpression') {

					node.arguments[0].elements.forEach(function (arrayItem) {
						if (['require', 'exports', 'module'].indexOf(arrayItem.value) < 0) {
							moduleData.requirecalls.unshift(arrayItem.value);
						}
					});

				}
			}
			moduleData.requirecalls = _.uniq(moduleData.requirecalls);

		}
	});

	if (define && updatedDefine) {
		moduleData.source = escodegen.generate(ast);
	} else {
		moduleData.source += ';define("' + module + '",[]);';
	}

	return moduleData;

}



function DependencyMapper () {
	Transform.apply(this, arguments);
}

util.inherits(DependencyMapper, Transform);

/**
 *
 * @param chunk
 * @param encoding
 * @param done
 * @private
 */
DependencyMapper.prototype._transform = function (chunk, encoding, done) {

	var data = chunk;

	data = ESfindDependencies(data);

	this.push(data);

	done();
}

module.exports = DependencyMapper;