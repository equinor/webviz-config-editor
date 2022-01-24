import electronStore from "@utils/electron-store";
import {getFileContent} from "@utils/file-operations";

import {File, FilesState, UpdateSource} from "@shared-types/files";
import {NotificationsState} from "@shared-types/notifications";
import {PreferencesState} from "@shared-types/preferences";
import {Pages, Themes, UiState} from "@shared-types/ui";
import {UiCoachState} from "@shared-types/ui-coach";

import fs from "fs";
import {SelectionDirection} from "monaco-editor";
import path from "path";

const paneConfiguration = electronStore.get("ui.paneConfiguration");

const initialUiState: UiState = {
    currentPage: Pages.Editor,
    settings: {
        theme: electronStore.get("ui.settings.theme") || Themes.Light,
    },
    paneConfiguration: Object.keys(paneConfiguration).map(key => ({
        name: key,
        sizes: paneConfiguration[key],
    })),
    recentDocuments: electronStore.get("ui.recentDocuments"),
};

const initialPreferencesState: PreferencesState = {
    pathToPythonInterpreter:
        electronStore.get("preferences.pathToPythonInterpreter") || "",
    pathToYamlSchemaFile:
        electronStore.get("preferences.pathToYamlSchemaFile") || "",
    webvizTheme: electronStore.get("preferences.webvizTheme") || "",
};

const initialUiCoachState: UiCoachState = {
    initialConfigurationDone:
        electronStore.get("uiCoach.initialConfigurationDone") || false,
};

const initialFilesState: FilesState = {
    activeFile: electronStore.get("files.activeFile"),
    files: electronStore.get("files.files").map(
        (file: any): File => ({
            filePath: file.filePath,
            associatedWithFile: fs.existsSync(file.filePath),
            editorValue: getFileContent(file.filePath),
            editorViewState: file.editorViewState,
            navigationItems: [],
            yamlObjects: [],
            updateSource: UpdateSource.Editor,
            currentPageId: "",
            unsavedChanges: false,
            selection: {
                startLineNumber: 0,
                startColumn: 0,
                endLineNumber: 0,
                endColumn: 0,
                direction: SelectionDirection.LTR,
            },
            selectedYamlObject: undefined,
            title: "",
        })
    ),
};

if (initialFilesState.files.length === 0) {
    initialFilesState.activeFile = path.join(__dirname, `Untitled-1.yaml`);
    initialFilesState.files.push({
        filePath: path.join(__dirname, `Untitled-1.yaml`),
        associatedWithFile: false,
        editorValue: "",
        editorViewState: null,
        navigationItems: [],
        yamlObjects: [],
        updateSource: UpdateSource.Editor,
        currentPageId: "",
        unsavedChanges: true,
        selection: {
            startLineNumber: 0,
            startColumn: 0,
            endLineNumber: 0,
            endColumn: 0,
            direction: SelectionDirection.LTR,
        },
        selectedYamlObject: undefined,
        title: "",
    });
}

const notificationsState: NotificationsState = {
    notifications: [],
};

export default {
    ui: initialUiState,
    uiCoach: initialUiCoachState,
    preferences: initialPreferencesState,
    files: initialFilesState,
    notifications: notificationsState,
};
