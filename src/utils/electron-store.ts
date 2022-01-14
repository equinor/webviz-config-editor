const ElectronStore = require("electron-store");

const schema = {
    preferences: {
        type: "object",
        properties: {
            pathToPythonInterpreter: {
                type: "string",
            },
            pathToYamlSchemaFile: {
                type: "string",
            },
            webvizTheme: {
                type: "string",
            },
        },
    },
    ui: {
        type: "object",
        properties: {
            settings: {
                type: "object",
                properties: {
                    theme: {
                        type: "string",
                    },
                },
            },
            paneConfiguration: {
                type: "object",
                patternProperties: {
                    ".*": {
                        type: "array",
                        items: {
                            type: "number",
                        },
                    },
                },
            },
        },
    },
    uiCoach: {
        type: "object",
        properties: {
            initialConfigurationDone: {
                type: "boolean",
            },
        },
    },
};

const defaults = {
    preferences: {
        pathToPythonInterpreter: "",
        pathToYamlSchemaFile: "",
        webvizTheme: "",
    },
    ui: {
        settings: {
            theme: "light",
        },
        paneConfiguration: {
            "Editor-Issues": [0.7, 0.3],
            "Editor-LivePreview": [0.5, 0.5],
        },
    },
    uiCoach: {
        initialConfigurationDone: false,
    },
};

const electronStore = new ElectronStore({
    schema,
    defaults,
});

export default electronStore;
