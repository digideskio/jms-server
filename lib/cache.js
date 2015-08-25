






function cache (server, options, next) {

	var cache = server.cache({ segment: 'modules', expiresIn: 24 * 60 * 60 * 1000 });

	server.ext('onPostHandler', function (request, reply) {

		if (!request.moduleRequest || request.moduleRequest.cached || request.response.statusCode !== 200) {
			return reply.continue();
		}

		server.log(['cache', 'set'], request.moduleRequest.href);

		cache.set(request.moduleRequest.href,
			JSON.stringify({
				source: request.response.source,
				length: request.response.headers['content-length'],
				lastModified: request.response.headers['last-modified']
			}),
			null,
			reply.continue.bind(reply)
		);

	});

	return next();
}



cache.attributes = {
	pkg: {
		"name": "cache",
		"version": "1.0.0",
		"description": "jms-server cache handling"
	}
}

module.exports = cache;