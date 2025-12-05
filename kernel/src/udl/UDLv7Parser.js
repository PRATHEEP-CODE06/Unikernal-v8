const yaml = require('js-yaml'); // Assuming js-yaml is available or we use JSON
const fs = require('fs');

class UDLv7Parser {
    static parse(content, format = 'json') {
        try {
            let parsed;
            if (format === 'yaml') {
                parsed = yaml.load(content);
            } else {
                parsed = JSON.parse(content);
            }

            return UDLv7Parser.validateAndNormalize(parsed);
        } catch (err) {
            throw new Error(`UDL Parsing Failed: ${err.message}`);
        }
    }

    static validateAndNormalize(udl) {
        if (!udl.systems) udl.systems = {};
        if (!udl.routes) udl.routes = [];
        if (!udl.policies) udl.policies = {};

        // Normalize routes
        udl.routes = udl.routes.map(route => {
            if (!route.from || !route.to) {
                throw new Error("Invalid route: missing 'from' or 'to'");
            }
            return route;
        });

        return udl;
    }
}

module.exports = UDLv7Parser;
