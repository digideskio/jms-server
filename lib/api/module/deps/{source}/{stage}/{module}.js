'use strict';

/**
 * Operations on /module/deps/{source}/{stage}/{module}
 */
module.exports = {
    
    /**
     * Returns a list of modules that the given module is depending on
     * parameters: source, stage, module
     * produces: 
     */
    get: function (req, reply) {
        reply().code(501);
    }
    
};
