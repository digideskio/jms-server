'use strict';

/**
 * Operations on /module/{source}/{stage}/name/{module}
 */
module.exports = {
    
    /**
     * Returns information of a module, that is handled by JMS

     * parameters: source, stage, module
     * produces: 
     */
    get: function (req, reply) {

        var params = req.params;
        var query = req.query;

        req.server.methods.storage(
            'getMap',
            params.source,
            params.stage,
            [query.module],
            function (err, result) {

                req.server.methods.storage(
                    'getModules',
                    params.source,
                    params.stage,
                    result,
                    function (err, result) {

                        reply(result.map(JSON.parse)).header('Access-Control-Allow-Origin', '*');
                    }
                );
            }
        )

    }
    
};
