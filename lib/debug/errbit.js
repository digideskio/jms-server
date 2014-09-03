var config   = require('jms-config');
var airbrake = require('airbrake').createClient(config.debug.errbit.apiKey, config.debug.errbit.env);

airbrake.serviceHost = config.debug.errbit.host;
airbrake.protocol = config.debug.errbit.protocol;

airbrake.handleExceptions();



module.exports = function (component) {
	return {
		setComponent: function (newComponent) {
			component = newComponent;
		},
		notify: function (err) {
			if (component && !err.component) {
				err.component = component;
			}

			airbrake.notify(err);
		}
	};
};


/*


 var errbit = require('./lib/errbitlog')('URNA');


onerror: function (err) {
 err.params = {
 	name: this.logConf.errbit.name
 };
 errbit.notify(err);
 }

 */