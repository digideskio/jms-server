var npmlog = require('npmlog');

var padDateDoubleStr = function(i){
	return (i < 10) ? "0" + i : "" + i;
};

var sqlDateTime = function(time){
	if(time == null){ time = new Date(); }
	var dateStr =
		padDateDoubleStr(time.getFullYear()) +
			"-" + padDateDoubleStr(1 + time.getMonth()) +
			"-" + padDateDoubleStr(time.getDate()) +
			" " + padDateDoubleStr(time.getHours()) +
			":" + padDateDoubleStr(time.getMinutes()) +
			":" + padDateDoubleStr(time.getSeconds());
	return dateStr;
};


var log = function(level, module, info){
	npmlog.log(level, module, info);
}


module.exports = function (config) {

	npmlog.level = config.debug && config.debug.loglevel ? config.debug.loglevel : 'info';

	return {
		verbose: log.bind(log, 'verbose'),
		info: log.bind(log, 'info'),
		warn: log.bind(log, 'warn'),
		error: log.bind(log, 'error')
	}
}
