var os        = require('os');
var ipm2      = require('pm2-interface')();
var config    = require('jms-config');
var monitConf = config.monit;

var metrics = {
	jms: {}
};

metrics.jms[os.hostname()] = {};

var graphite = require('graphite');
var graphiteClient = graphite.createClient('plaintext://graphite-relay.ustream-adm.in:2003/');

function setMetric (metric, value) {
	metrics.jms[os.hostname()][metric] = value;
}

var concurrent = 0,
	served = 0,
	reqpersec = 0,
	cputime = 0,
	memory = 0,
	procData = [],
	exitspersec = 0,
	exits = 0,
	exceptions = 0;

var all_requests = 0,
	timestamp = 0,
	requests_in_timestamp = 0,
	exits_in_timestamp = 0,
	concurrent_requests = 0;

if (monitConf.enabled) {

	ipm2.on('ready', onPM2ready);

	var http = require('http');
	http.createServer(function (req, res) {

		var status = 200;

		if (procData.length < 1) {
			status = 503;
		}

		if (reqpersec > monitConf.max_requests) {
			status = 503;
		}

		if (exitspersec > 1) {
			status = 503;
		}

		res.writeHead(status, {
			'Content-Type': 'text/plain',
			'Access-Control-Allow-Origin': '*'
		});

		res.end(JSON.stringify({
			concurrent: concurrent,
			served: served,
			reqpersec: reqpersec,
			cpu: cputime,
			mem: memory,
			processes: procData,
			exits: exits,
			exitspersec: exitspersec,
			exceptions: exceptions

		}));

	}).listen(monitConf.port, monitConf.host);
}


function onPM2ready () {

	ipm2.bus.on('process:stats', function(data) {

		var elapsed = data.data.ts - timestamp;
		all_requests += data.data.all;
		concurrent_requests += data.data.concurrent;

		if (elapsed > 0) {

			served = all_requests;
			reqpersec = Math.round(((all_requests - requests_in_timestamp) / (elapsed / 1000)) * 100) / 100;
			concurrent = concurrent_requests;
			requests_in_timestamp = all_requests;
			concurrent_requests = 0;

			exitspersec = Math.round(((exits - exits_in_timestamp) / (elapsed / 1000)) * 100) / 100;
			exits_in_timestamp = exits;

			setMetric('reqpersec', reqpersec);
			setMetric('concurrent', concurrent);

			setMetric('exits', exitspersec);
			setMetric('exceptions', exceptions);
			setMetric('served', served);


		}
		timestamp = data.data.ts;
	});

	ipm2.bus.on('process:exit', function(event, data){
		++exits;

	});

	ipm2.bus.on('process:exception', function(event, data){
		++exceptions;

	});

	setInterval(collectData, monitConf.interval);
}



function collectData () {

	var msg = {
		type:"god:stats",
		ts: +new Date()
	};

	ipm2.rpc.getSystemData({
		name:"jms"
	}, function (err, data) {

		procData = [];

		if (data) {
			data.processes.forEach(function (proc) {

				if (proc.name !== 'jms') {
					return;
				}

				if (proc.pm2_env.status !== 'online') {
					return;
				}

				procData.push({
					status: proc.pm2_env.status,
					uptime: data.system.time - proc.pm2_env.created_at
				});
			});
		}
	});

	ipm2.rpc.getMonitorData({
			name: "jms"
		},
		function(err, processData) {

			if (err) {
				throw err;
			}

			var len = processData.length,
				mem = 0,
				cpu = 0;

			for (var i = 0; i < len ; i++) {
				mem += processData[i].monit.memory;
				cpu += processData[i].monit.cpu;
			}

			memory = mem;
			cputime = Math.round(cpu / len);

			setMetric('mem', memory);
			setMetric('cpu', cputime);


		});

	ipm2.rpc.msgProcess(
		{
			name: "jms",
			msg:msg
		},
		function (err, res) {}
	);

	graphiteClient.write(metrics);
}