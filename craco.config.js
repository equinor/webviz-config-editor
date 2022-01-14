const {getLoader, loaderByName} = require("@craco/craco");

const CracoAlias = require("craco-alias");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
    webpack: {
        plugins: {
            add: [
                new MonacoWebpackPlugin({languages: ["yaml"], globalAPI: true}),
            ],
        },
        configure: (webpackConfig, {env}) => {
            webpackConfig.node.__dirname = false;
            webpackConfig.target = "electron-renderer";
            if (env === "development") {
                const workerLoaderOverrideOptions = {
                    loader: "worker-loader",
                    options: {
                        filename: "[path].[name].[contenthash].worker.js",
                    },
                };

                const {isFound, match} = getLoader(
                    webpackConfig,
                    loaderByName("worker-loader")
                );
                if (isFound) {
                    match.parent[match.index] = workerLoaderOverrideOptions;
                }
            }

            return webpackConfig;
        },
    },
    plugins: [
        {
            plugin: CracoAlias,
            options: {
                source: "tsconfig",
                baseUrl: "./",
                tsConfigPath: "./paths.json",
                unsafeAllowModulesOutsideOfSrc: false,
                debug: false,
            },
        },
    ],
};
