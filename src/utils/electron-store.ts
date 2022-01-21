import {UpdateSource} from "@shared-types/files";

import {Selection, SelectionDirection, Uri, editor} from "monaco-editor";
import path from "path";

const ElectronStore = require("electron-store");

const IPosition = {
    type: "object",
    properties: {
        lineNumber: {
            type: "number",
        },
        column: {
            type: "number",
        },
    },
};

const ICursorState = {
    type: "object",
    properties: {
        inSelectionMode: {
            type: "boolean",
        },
        selectionStart: IPosition,
        position: IPosition,
    },
};

const IViewState = {
    type: "object",
    properties: {
        scrollTop: {
            type: "number",
        },
        scrollTopWithoutViewZones: {
            type: "number",
        },
        scrollLeft: {
            type: "number",
        },
        firstPosition: IPosition,
        firstPositionDeltaTop: {
            type: "number",
        },
    },
};

const ICodeEditorViewState = {
    type: "object",
    properties: {
        cursorState: {
            type: "array",
            items: ICursorState,
        },
        viewState: IViewState,
    },
};

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
            recentDocuments: {
                type: "array",
                items: {
                    type: "string",
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
    files: {
        type: "object",
        properties: {
            activeFile: {
                type: "string",
            },
            files: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                        },
                        editorViewState: ICodeEditorViewState,
                    },
                },
            },
            recentDocuments: {
                type: "array",
                items: {
                    type: "string",
                },
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
    files: {
        activeFile: "",
        files: [
            {
                filePath: path.join(__dirname, `Untitled-1.yaml`),
                editorModel: editor.createModel(
                    "",
                    "yaml",
                    Uri.parse(path.join(__dirname, `Untitled-1.yaml`))
                ),
                editorViewState: null,
                navigationItems: [],
                yamlObjects: [],
                updateSource: UpdateSource.Editor,
                currentPageId: "",
                unsavedChanges: false,
                selection: Selection.createWithDirection(
                    0,
                    0,
                    0,
                    0,
                    SelectionDirection.LTR
                ),
                selectedYamlObject: undefined,
                title: "",
            },
        ],
        recentDocuments: [],
    },
};

const electronStore = new ElectronStore({
    schema,
    defaults,
});

export default electronStore;
