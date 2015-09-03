var redis = require('redis');
var config = require('./config.js');
var data = require('./data.json');

var client = redis.createClient(
		config.storage.redis.port,
		config.storage.redis.host,
		{
			parser: 'javascript'
		}
);

client.select(config.storage.redis.database, fill);



client.on('error', function (err) {
	throw err;
});

var hset = function (data, hash, done) {
	Object.keys(data).forEach(function (key) {
		client.hset(hash, key, data[key], done);
	})
}

var getCount = function (data) {

	var c = 0;

	if (typeof data == 'object') {
		var k = Object.keys(data);
		k.forEach(function (k) {
			c += getCount(data[k])
		});
	} else {
		c = 1;
	}

	return c;
}

var count = 0
count = getCount(data);


function done () {
	count -= 1;

	if (count == 0) {
		process.exit(0)
	}
}


function fill (err) {
	if (err) throw err;

	client.flushdb();

	Object.keys(data.maps).forEach(function (key) {
		hset(data.maps[key], key, done)
	})

	Object.keys(data.versions).forEach(function (key) {
		hset(data.versions[key], key, done)
	})


	Object.keys(data.source).forEach(function (key) {
		client.hmset('source', key, data.source[key], done);
	})

}