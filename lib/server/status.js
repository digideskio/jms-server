module.exports = function (request, reply) {

	var stat = {
		pid: process.pid,
		port:this.info.port,
		connections: this.connections.length
	}

	return reply(JSON.stringify(stat)).code(200);
}