


module.exports = function (request, reply) {

	var server = request.server;
	var config = server.settings.app;

	var stat = {
		version: config.version,
		pid: process.pid,
		port:this.info.port,
		connections: this.connections.length,
		load: this.load
	}

	return reply(JSON.stringify(stat)).code(200);
}