import electronStore from "@utils/electron-store";
import {getFileContent} from "@utils/file-operations";

import {File, FilesState, UpdateSource} from "@shared-types/files";
import {NotificationsState} from "@shared-types/notifications";
import {PreferencesState} from "@shared-types/preferences";
import {Pages, Themes, UiState} from "@shared-types/ui";
import {UiCoachState} from "@shared-types/ui-coach";

import {Selection, SelectionDirection, Uri, editor} from "monaco-editor";

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
            editorModel: editor.createModel(
                getFileContent(file.filePath),
                "yaml",
                Uri.parse(file.filePath)
            ),
            editorViewState: file.editorViewState,
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
        })
    ),
};

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
