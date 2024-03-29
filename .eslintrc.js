"use strict"

module.exports = {
    parserOptions: {},
    extends: [
        "plugin:@ota-meshi/recommended",
        "plugin:@ota-meshi/+node",
        "plugin:@ota-meshi/+json",
        "plugin:@ota-meshi/+package-json",
        "plugin:@ota-meshi/+yaml",
        // "plugin:@ota-meshi/+md",
        "plugin:@ota-meshi/+prettier",
    ],
    plugins: [],
    rules: {
        "require-jsdoc": "error",
        "no-warning-comments": "warn",
    },

    overrides: [
        {
            files: ["scripts/*.js"],
            rules: {
                "require-jsdoc": "off",
            },
        },
    ],
}
