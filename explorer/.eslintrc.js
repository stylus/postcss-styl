module.exports = {
    parserOptions: {
        sourceType: "module",
        ecmaVersion: 2020,
    },
    extends: [
        "plugin:@ota-meshi/+vue3",
        "plugin:@ota-meshi/+json",
        "plugin:@ota-meshi/+prettier",
    ],
    rules: {
        "node/no-unsupported-features/es-syntax": "off",
        "node/no-missing-import": "off",
        "node/no-unpublished-require": "off",
        complexity: "off",
        "node/no-missing-require": "off",
        "node/no-extraneous-require": "off",
    },
}
