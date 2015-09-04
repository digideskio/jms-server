var assert = require('assert');
var request = require('request');
var http = require('http');
var config = require('../scripts/config.js');


suite('module serving', function () {

	suite('basic functionality', function () {

		test('unhashed request redirects to hashed module path', function (done) {

			http.get('http://127.0.0.1:1337/js/test/master/+app/foo.js', function (res) {

				assert.equal(res.statusCode, 302, '302 response');
				assert.equal(res.headers.location, '/js/+hash1111.js', 'correct redirect path');

				done();

			}).on('error', done)

		});

		test('hashed request responds with 200 OK', function (done) {

			request('http://127.0.0.1:1337/js/+hash1111.js', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(response.statusCode, 200);

				done();
			})
		});

		test('correct hashed request content', function (done) {

			request('http://127.0.0.1:1337/js/+hash1111.js', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(body.split('\n')[0], 'define(\'hash1111\',[],function(){})');
				assert.equal(body.split('\n')[1], '//# sourceMappingURL=/js/+hash1111.js?sourceMap=1');

				done();
			})
		});

	});

	suite('ordered calls', function () {

		test('correct hashed request content', function (done) {

			request('http://127.0.0.1:1337/js/+hash1111.js?cb=jmscb_1', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(body.split('\n')[0], 'window["jmscb_1"] = function() { var ret = {};ret.payload = function (__jmsctx) {var define = __jmsctx.define,require = __jmsctx.require,requirejs = __jmsctx.requirejs,jms = __jmsctx.jms;');
				assert.equal(body.split('\n')[1], 'define(\'hash1111\',[],function(){})');
				assert.equal(body.split('\n')[2], '};ret.list="hash1111";return ret;};');
				assert.equal(body.split('\n')[3], '//# sourceMappingURL=/js/+hash1111.js?cb=jmscb_1&sourceMap=1');

				done();
			})
		});

	});

	suite('negative loading', function () {

		test('collects dependencies', function (done) {

			request('http://127.0.0.1:1337/js/+hash2111.js', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(body.split('\n')[0], 'define(\'hash2112\',[],function(){});');
				assert.equal(body.split('\n')[1], 'define(\'hash2111\',[\'hash2112\'],function(a){})');
				assert.equal(body.split('\n')[2], '//# sourceMappingURL=/js/+hash2111.js?sourceMap=1');

				done();
			})
		});

		test('handles dependency exclusion', function (done) {

			request('http://127.0.0.1:1337/js/+hash2111-hash2112.js', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(body.split('\n')[0], 'define(\'hash2111\',[\'hash2112\'],function(a){})');
				assert.equal(body.split('\n')[1], '//# sourceMappingURL=/js/+hash2111-hash2112.js?sourceMap=1');

				done();
			})
		});
	});

	suite('version lookup', function () {

		test('serve available older version of module on request', function (done) {

			request('http://127.0.0.1:1337/js/+hash2121.js', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(body.split('\n')[0], 'define(\'hash2112\',[],function(){});');
				assert.equal(body.split('\n')[1], 'define(\'hash2121\',[\'hash2112\'],function(a){a()})');
				assert.equal(body.split('\n')[2], '//# sourceMappingURL=/js/+hash2121.js?sourceMap=1');

				done();
			})
		});

	});

});