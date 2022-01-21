import {Draft, PayloadAction, createSlice} from "@reduxjs/toolkit";

import electronStore from "@utils/electron-store";
import {YamlMetaObject, YamlObject} from "@utils/yaml-parser";

import initialState from "@redux/initial-state";

import {File, FilesState, UpdateSource} from "@shared-types/files";

import {Selection, SelectionDirection, Uri, editor} from "monaco-editor";
import path from "path";

const disposeUnusedDefaultModel = (files: File[]) => {
    if (
        files.length === 1 &&
        files[0].editorModel.uri.path ===
            Uri.parse(path.join(__dirname, "Untitled-1.yaml")).path &&
        files[0].editorModel.getValue() === ""
    ) {
        files[0].editorModel.dispose();
        files.shift();
    }
};

export const filesSlice = createSlice({
    name: "files",
    initialState: initialState.files,
    reducers: {
        setActiveFile: (
            state: Draft<FilesState>,
            action: PayloadAction<{
                filePath: string;
                viewState: editor.ICodeEditorViewState | null;
            }>
        ) => {
            const currentlyActiveFile = state.files.find(
                file => file.filePath === state.activeFile
            );
            if (currentlyActiveFile) {
                currentlyActiveFile.editorViewState = action.payload.viewState;
            }
            state.activeFile = action.payload.filePath;
            electronStore.set("files.activeFile", action.payload);
        },
        addFile: (
            state: Draft<FilesState>,
            action: PayloadAction<{filePath: string; fileContent: string}>
        ) => {
            // Do not open file when already opened, but make it active
            const openedFile = state.files.find(
                el => el.editorModel.uri.path === action.payload.filePath
            );
            if (openedFile) {
                state.activeFile = action.payload.filePath;
                return;
            }

            disposeUnusedDefaultModel(state.files);

            state.activeFile = action.payload.filePath;
            state.files.push({
                currentPageId: "",
                selection: Selection.createWithDirection(
                    0,
                    0,
                    0,
                    0,
                    SelectionDirection.LTR
                ),
                editorModel: editor.createModel(
                    action.payload.fileContent,
                    "yaml",
                    Uri.parse(action.payload.filePath)
                ),
                editorViewState: null,
                unsavedChanges: false,
                filePath: action.payload.filePath,
                navigationItems: [],
                yamlObjects: [],
                selectedYamlObject: undefined,
                updateSource: UpdateSource.Editor,
                title: "",
            });
        },
        addNewFile: (state: Draft<FilesState>) => {
            const filePath = path.join(
                __dirname,
                `Untitled-${
                    state.files.filter(file =>
                        file.editorModel.uri.path.includes("Untitled-")
                    ).length + 1
                }.yaml`
            );
            state.files.push({
                currentPageId: "",
                selection: Selection.createWithDirection(
                    0,
                    0,
                    0,
                    0,
                    SelectionDirection.LTR
                ),
                editorModel: editor.createModel(
                    "",
                    "yaml",
                    Uri.parse(filePath)
                ),
                editorViewState: null,
                unsavedChanges: true,
                filePath,
                navigationItems: [],
                yamlObjects: [],
                selectedYamlObject: undefined,
                updateSource: UpdateSource.Editor,
                title: "",
            });
        },
        closeFile: (
            state: Draft<FilesState>,
            action: PayloadAction<string>
        ) => {
            const fileToClose = state.files.find(
                file => file.filePath === action.payload
            );
            let newEditorContent = "";
            if (fileToClose) {
                window.setTimeout(() => fileToClose.editorModel.dispose(), 100);
                let newActiveFile = state.activeFile;
                if (action.payload === state.activeFile) {
                    if (state.files.length >= 2) {
                        newActiveFile = state.files.filter(
                            el => el.filePath !== action.payload
                        )[
                            Math.max(
                                0,
                                (state.files
                                    .filter(
                                        el => el.filePath !== action.payload
                                    )
                                    .findIndex(
                                        file => file.filePath === action.payload
                                    ) || 0) - 1
                            )
                        ].filePath;
                    } else {
                        newActiveFile = "";
                    }
                }
                state.files = state.files.filter(
                    file => file.filePath !== action.payload
                );
            }
        },
        markAsSaved: (
            state: Draft<FilesState>,
            action: PayloadAction<string>
        ) => {
            state.files = state.files.map(f =>
                f.filePath === action.payload
                    ? {...f, unsavedChanges: false}
                    : f
            );
        },
        markAsUnsaved: (
            state: Draft<FilesState>,
            action: PayloadAction<string>
        ) => {
            state.files = state.files.map(f =>
                f.filePath === action.payload ? {...f, unsavedChanges: true} : f
            );
        },
        changeFilePath: (
            state: Draft<FilesState>,
            action: PayloadAction<{oldFilePath: string; newFilePath: string}>
        ) => {
            const file = state.files.find(
                f => f.filePath === action.payload.oldFilePath
            );
            if (file) {
                const newEditorModel = editor.createModel(
                    file.editorModel.getValue(),
                    "yaml",
                    Uri.parse(action.payload.newFilePath)
                );
                file.editorModel.dispose();
                state.files = state.files.map(f =>
                    f.filePath === action.payload.oldFilePath
                        ? {
                              ...f,
                              unsavedChanges: false,
                              editorModel: newEditorModel,
                          }
                        : f
                );
            }
        },
        setFileObjects: (
            state: Draft<FilesState>,
            action: PayloadAction<{
                yamlObjects: YamlObject[];
                title: string;
                navigationItems: any;
            }>
        ) => {
            state.files.map(file =>
                file.filePath === state.activeFile
                    ? {
                          ...file,
                          yamlObjects: action.payload.yamlObjects,
                          title: action.payload.title,
                          navigationItems: action.payload.navigationItems,
                      }
                    : file
            );
        },
        setFileObjectsAndSelection: (
            state: Draft<FilesState>,
            action: PayloadAction<{
                yamlObjects: YamlObject[];
                selectedObject: YamlMetaObject;
                pageId: string;
            }>
        ) => {
            state.files.map(file =>
                file.filePath === state.activeFile
                    ? {
                          ...file,
                          yamlObjects: action.payload.yamlObjects,
                      }
                    : file
            );
        },
        setSelectedObject: (
            state: Draft<FilesState>,
            action: PayloadAction<{
                object: YamlMetaObject | undefined;
                pageId: string;
            }>
        ) => {
            state.files.map(file =>
                file.filePath === state.activeFile
                    ? {
                          ...file,
                          selectedYamlObject: action.payload.object,
                          currentPageId: action.payload.pageId,
                      }
                    : file
            );
        },
    },
});

export const {
    setActiveFile,
    addFile,
    addNewFile,
    closeFile,
    markAsSaved,
    changeFilePath,
    setFileObjects,
    setFileObjectsAndSelection,
    setSelectedObject,
} = filesSlice.actions;
export default filesSlice.reducer;
