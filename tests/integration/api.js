var assert = require('assert');
var request = require('request');
var config = require('../scripts/config.js');

suite('api v1', function () {

	suite('/module/list/{source}/{stage}', function () {

		test('responds 200 on valid request', function (done) {

			request('http://127.0.0.1:1337/api/v1/module/list/test/master', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(response.statusCode, 200);

				done();
			})
		});

		test('responds 404 if some parameter is wrong', function (done) {

			request('http://127.0.0.1:1337/api/v1/module/list/test/barpaz', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(response.statusCode, 404);

				done();
			})
		});

		test('valid data received', function (done) {

			request('http://127.0.0.1:1337/api/v1/module/list/test/master', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(body, '["app/foo","lib/util"]');

				done();
			})
		});

	});

	suite('/module/name/{source}/{stage}', function () {

		test('responds 200 on valid request', function (done) {

			request('http://127.0.0.1:1337/api/v1/module/name/test/master?module=app/foo', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(response.statusCode, 200);

				done();
			})
		});

		test('responds 404 if some parameter is wrong', function (done) {

			request('http://127.0.0.1:1337/api/v1/module/name/test/master?module=app/bar', function (error, response, body) {
				if (error) {
					return done(error)
				}
				assert.equal(response.statusCode, 404);

				done();
			})
		});

		test('valid data received', function (done) {

			request('http://127.0.0.1:1337/api/v1/module/name/test/master?module=app/foo', function (error, response, body) {
				if (error) {
					return done(error)
				}

				var modules = JSON.parse(body)

				assert.equal(modules.length, 1);
				assert.equal(modules[0].originalModule , 'app/foo');

				done();
			})
		});

	});

	suite('/module/hash/{module}', function () {

		test('responds 200 on valid request', function (done) {

			request('http://127.0.0.1:1337/api/v1/module/hash/hash1112', function (error, response, body) {
				if (error) {
					return done(error)
				}
				assert.equal(response.statusCode, 200);

				done();
			})
		});

		test('responds 404 if some parameter is wrong', function (done) {
			request('http://127.0.0.1:1337/api/v1/module/hash/foobar1112', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(response.statusCode, 404);

				done();
			})
		});

		test('valid data received', function (done) {
			request('http://127.0.0.1:1337/api/v1/module/hash/hash1112', function (error, response, body) {
				if (error) {
					return done(error)
				}

				var modules = JSON.parse(body);

				assert.equal(modules.length, 1);
				assert.equal(modules[0].originalModule , 'lib/util');

				done();
			})
		});

	});

	suite('/module/versions/{stage}', function () {

		test('responds 200 on valid request', function (done) {

			request('http://127.0.0.1:1337/api/v1/module/versions/master', function (error, response, body) {
				if (error) {
					return done(error)
				}
				assert.equal(response.statusCode, 200);

				done();
			})
		});

		test('responds 404 if some parameter is wrong', function (done) {
			request('http://127.0.0.1:1337/api/v1/module/versions/barpaz', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(response.statusCode, 404);

				done();
			})
		});

		test('valid data received', function (done) {
			request('http://127.0.0.1:1337/api/v1/module/versions/master', function (error, response, body) {
				if (error) {
					return done(error)
				}

				var modules = JSON.parse(body);

				assert.equal(modules.length, 2);

				var sources = [modules[0].source, modules[1].source];

				assert(sources.indexOf('test') > -1);
				assert(sources.indexOf('foobar') > -1);

				done();
			})
		});

	});

	suite('/module/versions/{stage}/{source}', function () {

		test('responds 200 on valid request', function (done) {

			request('http://127.0.0.1:1337/api/v1/module/versions/master/test', function (error, response, body) {
				if (error) {
					return done(error)
				}
				assert.equal(response.statusCode, 200);

				done();
			})
		});

		test('responds 404 if some parameter is wrong', function (done) {
			request('http://127.0.0.1:1337/api/v1/module/versions/barpaz/test', function (error, response, body) {
				if (error) {
					return done(error)
				}

				assert.equal(response.statusCode, 404);

				done();
			})
		});

		test('valid data received', function (done) {
			request('http://127.0.0.1:1337/api/v1/module/versions/master/test', function (error, response, body) {
				if (error) {
					return done(error)
				}

				var modules = JSON.parse(body);
				var mods = Object.keys(modules);

				assert.equal(mods[0], 'app/foo');
				assert.equal(mods[1], 'lib/util');

				done();
			})
		});

	});
});