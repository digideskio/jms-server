'use strict';

/**
 * Operations on /module/{source}/{stage}
 */
module.exports = {

	/**
	 * Get module names from the given source and stage

	 * parameters: source, stage
	 * produces:
	 */
	get: function (req, reply) {

		var params = req.params;
		var query = req.query;

		console.log(params, query);

		req.server.methods.storage(
			'getAllVersions',
			params.source,
			params.stage,
			function (err, result) {
				reply(Object.keys(result)).header('Access-Control-Allow-Origin', '*');
			}
		);
	}

};
