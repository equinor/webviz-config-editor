const {getLoader, loaderByName, addBeforeLoader} = require("@craco/craco");

const CracoAlias = require("craco-alias");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
    webpack: {
        plugins: {
            add: [
                new MonacoWebpackPlugin({
                    customLanguageslanguages: ["yaml"],
                    globalAPI: true,
                    filename: "static/vs/[name].[contenthash].worker.js",
                }),
            ],
        },
        configure: (webpackConfig, {env}) => {
            const isEnvDevelopment = env === "development";
            const isEnvProduction = env === "production";

            webpackConfig.target = "electron-renderer";

            if (isEnvDevelopment) {
                webpackConfig.output.filename = "static/js/[name].bundle.js";
                const workerLoaderOverrideOptions = {
                    test: /\.worker\.(c|m)?[tj]s$/i,
                    use: [
                        {
                            loader: "worker-loader",
                            options: {
                                filename: "static/js/[name].bundle.js",
                            },
                        },
                        {
                            loader: "babel-loader",
                            options: {
                                presets: ["@babel/preset-env"],
                            },
                        },
                    ],
                };

                console.log("Trying to adjust 'worker-loader'...");

                const workerLoader = getLoader(
                    webpackConfig,
                    loaderByName("worker-loader")
                );
                if (workerLoader.isFound) {
                    console.log("'worker-loader' found. Overwriting...");
                    workerLoader.match.parent[workerLoader.match.index] =
                        workerLoaderOverrideOptions;
                } else {
                    console.log(
                        "'worker-loader' not found. Adding before 'url-loader'..."
                    );
                    const added = addBeforeLoader(
                        webpackConfig,
                        loaderByName("url-loader"),
                        workerLoaderOverrideOptions
                    );
                    console.log(
                        `'worker-loader' ${
                            added.isAdded ? "successfully" : "not "
                        } added.`
                    );
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
