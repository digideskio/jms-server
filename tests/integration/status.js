var assert = require('assert');
var request = require('request');
var config = require('../scripts/config.js');


suite('status', function () {


	test('responds with 200 OK', function (done) {

		request('http://127.0.0.1:1337/status', function (error, response, body) {
			if (error) {
				return done(error)
			}
			assert.equal(response.statusCode, 200);
			done();
		})
	});

});