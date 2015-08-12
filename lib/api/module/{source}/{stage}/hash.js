'use strict';

var _      = require('lodash');

/**
 * Operations on /module/{source}/{stage}/hash
 */
module.exports = {
    
    /**
     * Returns information of a module, that is handled by JMS

     * parameters: source, stage, hash
     * produces: 
     */
    get: function (req, reply) {

        var params = req.params;
        var query = req.query;

        req.server.methods.storage(
            'getModules',
            params.source,
            params.stage,
            [query.module],
            function (err, result) {
                reply(result.map(JSON.parse)).header('Access-Control-Allow-Origin', '*');
            }
        );

    }
    
};
