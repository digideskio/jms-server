module.exports = function (request, reply) {

	var stat = {
		pid: process.pid,
		port:this.info.port,
		connections: this.connections.length,
		load: this.load
	}

	return reply(JSON.stringify(stat)).code(200);
}