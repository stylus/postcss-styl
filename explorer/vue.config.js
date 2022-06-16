const webpack = require("webpack")
module.exports = {
    publicPath: "/postcss-styl/",

    configureWebpack(_config, _isServer) {
        return {
            resolve: {
                alias: {
                    stylus: require.resolve(
                        "../node_modules/stylus/lib/stylus",
                    ),
                    module: require.resolve("./shim/module"),
                },
                fallback: {
                    assert: false,
                    fs: false,
                    path: false,
                    url: false,
                    glob: false,
                    crypto: false,
                    util: false,
                    "source-map-resolve": false,
                },
            },
            plugins: [
                new webpack.DefinePlugin({
                    "process.version": JSON.stringify(process.version),
                    "process.platform": JSON.stringify("darwin"),
                    // process: JSON.stringify(process),
                }),
            ],
        }
    },
}
