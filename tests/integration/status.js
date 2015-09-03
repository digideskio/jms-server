var assert = require('assert');
var http = require('http');
var config = require('../scripts/config.js');

suite('status', function () {

	test('responds with 200 OK', function (done) {

		http.get('http://127.0.0.1:1337/status', function (res) {

			assert(res.statusCode == 200);

			done();
		}).on('error', function (e) {
			throw e;
		})

	});

});