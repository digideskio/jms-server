//var heapdump = require('heapdump');
var config = require('jms-config');
var airbrake = require('airbrake').createClient(config.debug.errbit.apiKey, config.debug.errbit.env);

airbrake.serviceHost = config.debug.errbit.host;
airbrake.protocol = config.debug.errbit.protocol;

airbrake.handleExceptions();


var server = require('../server')(config);

