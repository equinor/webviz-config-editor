import {ipcRenderer} from "electron";

import React from "react";

import {createGenericContext} from "@utils/generic-context";
import {LayoutObject, YamlMetaObject, YamlObject} from "@utils/yaml-parser";

import {useNotifications} from "@components/Notifications";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import YamlParserWorker from "@workers/parser.worker";

import {File} from "@shared-types/file";
import {LogEntry, LogEntryType} from "@shared-types/log";
import {PropertyNavigationType} from "@shared-types/navigation";
import {Setting} from "@shared-types/settings";
import {
    YamlParserWorkerRequestType,
    YamlParserWorkerResponseType,
} from "@shared-types/yaml-parser-worker";

import fs from "fs";
import {Selection, SelectionDirection, Uri, editor} from "monaco-editor";
import path from "path";
import {uuid} from "uuidv4";

type ActionMap<
    M extends {
        [index: string]: {
            [key: string]:
                | string
                | number
                | Setting[]
                | object
                | editor.ICodeEditorViewState
                | null
                | YamlMetaObject
                | undefined
                | YamlObject[]
                | LayoutObject;
        };
    }
> = {
    [Key in keyof M]: M[Key] extends undefined
        ? {
              type: Key;
          }
        : {
              type: Key;
              payload: M[Key];
          };
};

export enum StoreActions {
    // Files
    SetActiveFile = "SET_ACTIVE_FILE",
    AddNewFile = "ADD_NEW_FILE",
    OpenFile = "OPEN_FILE",
    CloseFile = "CLOSE_FILE",
    DeleteFile = "DELETE_FILE",
    UpdateFileContent = "UPDATE_FILE_CONTENT",
    UpdateCurrentContent = "UPDATE_CURRENT_CONTENT",
    UpdateCurrentContentAndSetSelection = "UPDATE_CURRENT_CONTENT_AND_SET_SELECTION",
    UpdateSelection = "UPDATE_SELECTION",
    SaveFile = "SAVE_FILE",
    SaveFileAs = "SAVE_FILE_AS",
    SetCurrentPage = "SET_CURRENT_PAGE",
    SetRecentDocuments = "SET_RECENT_DOCUMENTS",
    SetCurrentObjects = "SET_CURRENT_OBJECTS",
    SetSelectedObject = "SET_SELECTED_OBJECT",
    SetCurrentObjectsAndSelection = "SET_CURRENT_OBJECTS_AND_SELECTION",
    SetPageId = "SET_PAGE_ID",
}

export enum UpdateSource {
    Editor = "EDITOR",
    Preview = "PREVIEW",
    Plugin = "PLUGIN",
}

export type StoreState = {
    activeFileUuid: string;
    title: string;
    navigationItems: PropertyNavigationType;
    files: File[];
    log: LogEntry[];
    currentEditorContent: string;
    currentYamlObjects: YamlObject[];
    selectedYamlObject: YamlMetaObject | undefined;
    updateSource: UpdateSource;
    yamlParserWorker: Worker;
    currentPageId: string;
    recentDocuments: string[];
};

type Payload = {
    [StoreActions.SetActiveFile]: {
        uuid: string;
        viewState: editor.ICodeEditorViewState | null;
    };
    [StoreActions.AddNewFile]: {};
    [StoreActions.OpenFile]: {
        filePath: string;
    };
    [StoreActions.CloseFile]: {
        uuid: string;
    };
    [StoreActions.DeleteFile]: {
        uuid: string;
    };
    [StoreActions.SaveFile]: {};
    [StoreActions.SaveFileAs]: {
        filePath: string;
    };
    [StoreActions.UpdateCurrentContent]: {
        content: string;
        source: UpdateSource;
    };
    [StoreActions.UpdateCurrentContentAndSetSelection]: {
        content: string;
        source: UpdateSource;
        selection: Selection;
    };
    [StoreActions.UpdateSelection]: {
        selection: Selection;
        source: UpdateSource;
    };
    [StoreActions.SetCurrentPage]: {
        pageId: string;
        source: UpdateSource;
    };
    [StoreActions.SetRecentDocuments]: {
        recentDocuments: string[];
    };
    [StoreActions.SetCurrentObjects]: {
        currentObjects: YamlObject[];
        title: string;
        navigationItems: PropertyNavigationType;
    };
    [StoreActions.SetCurrentObjectsAndSelection]: {
        currentObjects: YamlObject[];
        selectedObject: YamlObject;
        page?: LayoutObject;
    };
    [StoreActions.SetSelectedObject]: {
        object: YamlMetaObject | undefined;
        page?: LayoutObject;
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];

const initialUuid = uuid();

const initialState: StoreState = {
    activeFileUuid: initialUuid,
    title: "",
    navigationItems: [],
    files: [
        {
            uuid: initialUuid,
            editorModel: editor.createModel(
                "",
                "yaml",
                Uri.parse(path.join(__dirname, "Untitled-1.yaml"))
            ),
            editorViewState: null,
            unsavedChanges: true,
            selection: Selection.createWithDirection(
                0,
                0,
                0,
                0,
                SelectionDirection.LTR
            ),
        },
    ],
    log: [],
    currentEditorContent: "",
    currentYamlObjects: [],
    selectedYamlObject: undefined,
    updateSource: UpdateSource.Editor,
    yamlParserWorker: new YamlParserWorker(),
    currentPageId: "",
    recentDocuments: [],
};

export const StoreReducerInit = (state: StoreState): StoreState => {
    return initialState;
};

export const StoreReducer = (
    state: StoreState,
    action: Actions
): StoreState => {
    if (action.type === StoreActions.SetActiveFile) {
        const currentlyActiveFile = state.files.find(
            file => file.uuid === state.activeFileUuid
        );
        if (currentlyActiveFile) {
            currentlyActiveFile.editorViewState = action.payload.viewState;
        }
        const newEditorContent =
            state.files
                .find(file => file.uuid === action.payload.uuid)
                ?.editorModel.getValue() || "";

        state.yamlParserWorker.postMessage({
            type: YamlParserWorkerRequestType.Parse,
            text: newEditorContent,
        });
        return {
            ...state,
            currentEditorContent: newEditorContent,
            currentYamlObjects: [],
            selectedYamlObject: undefined,
            activeFileUuid: action.payload.uuid,
        };
    }
    if (action.type === StoreActions.OpenFile) {
        try {
            const existingFile = state.files.find(
                el => el.editorModel.uri.path === action.payload.filePath
            );
            if (existingFile) {
                return {
                    ...state,
                    activeFileUuid: existingFile.uuid,
                };
            }
            const newFiles = [...state.files];
            if (
                state.files.length === 1 &&
                state.files[0].editorModel.uri.path ===
                    Uri.parse(path.join(__dirname, "Untitled-1.yaml")).path &&
                state.files[0].unsavedChanges
            ) {
                state.files[0].editorModel.dispose();
                newFiles.shift();
            }
            const fileContent = fs
                .readFileSync(action.payload.filePath)
                .toString();
            const fileUuid = uuid();
            state.yamlParserWorker.postMessage({
                type: YamlParserWorkerRequestType.Parse,
                text: fileContent,
            });
            return {
                ...state,
                activeFileUuid: fileUuid,
                currentEditorContent: fileContent,
                currentYamlObjects: [],
                selectedYamlObject: undefined,
                updateSource: UpdateSource.Editor,
                files: [
                    ...newFiles,
                    {
                        uuid: fileUuid,
                        unsavedChanges: false,
                        editorModel: editor.createModel(
                            fileContent,
                            "yaml",
                            Uri.parse(action.payload.filePath)
                        ),
                        editorViewState: null,
                        selection: Selection.createWithDirection(
                            0,
                            0,
                            0,
                            0,
                            SelectionDirection.LTR
                        ),
                    },
                ],
            };
        } catch (e) {
            return {
                ...state,
                log: [
                    ...state.log,
                    {
                        datetimeMs: Date.now(),
                        type: LogEntryType.ERROR,
                        message: e as string,
                    },
                ],
            };
        }
    }
    if (action.type === StoreActions.AddNewFile) {
        const newUuid = uuid();
        return {
            ...state,
            files: [
                ...state.files,
                {
                    uuid: newUuid,
                    unsavedChanges: true,
                    editorModel: editor.createModel(
                        "",
                        "yaml",
                        Uri.parse(
                            path.join(
                                __dirname,
                                `Untitled-${
                                    state.files.filter(file =>
                                        file.editorModel.uri.path.includes(
                                            "Untitled-"
                                        )
                                    ).length + 1
                                }.yaml`
                            )
                        )
                    ),
                    editorViewState: null,
                    selection: Selection.createWithDirection(
                        0,
                        0,
                        0,
                        0,
                        SelectionDirection.LTR
                    ),
                },
            ],
            activeFileUuid: newUuid,
            currentEditorContent: "",
            currentYamlObjects: [],
            selectedYamlObject: undefined,
            updateSource: UpdateSource.Editor,
        };
    }
    if (action.type === StoreActions.CloseFile) {
        const fileToClose = state.files.find(
            file => file.uuid === action.payload.uuid
        );
        if (fileToClose) {
            window.setTimeout(() => fileToClose.editorModel.dispose(), 100);
            let newActiveFileUUid = state.activeFileUuid;
            if (action.payload.uuid === state.activeFileUuid) {
                if (state.files.length >= 2) {
                    newActiveFileUUid = state.files.filter(
                        el => el.uuid !== action.payload.uuid
                    )[
                        Math.max(
                            0,
                            (state.files
                                .filter(el => el.uuid !== action.payload.uuid)
                                .findIndex(
                                    file => file.uuid === action.payload.uuid
                                ) || 0) - 1
                        )
                    ].uuid;
                } else {
                    newActiveFileUUid = "";
                }
            }
            const newCurrentEditorContent =
                state.files
                    .find(file => file.uuid === newActiveFileUUid)
                    ?.editorModel.getValue() || "";
            state.yamlParserWorker.postMessage({
                type: YamlParserWorkerRequestType.Parse,
                text: newCurrentEditorContent,
            });
            return {
                ...state,
                files: state.files.filter(
                    file => file.uuid !== action.payload.uuid
                ),
                activeFileUuid: newActiveFileUUid,
                currentEditorContent: newCurrentEditorContent,
                currentYamlObjects: [],
                selectedYamlObject: undefined,
                updateSource: UpdateSource.Editor,
            };
        }
        return state;
    }
    if (action.type === StoreActions.DeleteFile) {
        try {
            const file = state.files.find(f => f.uuid === action.payload.uuid);
            if (file) {
                const filePath = file.editorModel.uri.path;
                if (fs.existsSync(filePath)) {
                    window.setTimeout(() => {
                        file.editorModel.dispose();
                        fs.unlinkSync(filePath);
                    }, 100);
                    let newActiveFileUUid = state.activeFileUuid;
                    if (action.payload.uuid === state.activeFileUuid) {
                        if (state.files.length >= 2) {
                            newActiveFileUUid = state.files.filter(
                                el => el.uuid !== action.payload.uuid
                            )[
                                Math.max(
                                    0,
                                    (state.files
                                        .filter(
                                            el =>
                                                el.uuid !== action.payload.uuid
                                        )
                                        .findIndex(
                                            f => f.uuid === action.payload.uuid
                                        ) || 0) - 1
                                )
                            ].uuid;
                        } else {
                            newActiveFileUUid = "";
                        }
                    }
                    const newCurrentEditorContent =
                        state.files
                            .find(f => f.uuid === newActiveFileUUid)
                            ?.editorModel.getValue() || "";
                    state.yamlParserWorker.postMessage({
                        type: YamlParserWorkerRequestType.Parse,
                        text: newCurrentEditorContent,
                    });
                    return {
                        ...state,
                        files: state.files.filter(
                            f => f.uuid !== action.payload.uuid
                        ),
                        activeFileUuid: newActiveFileUUid,
                        currentEditorContent: newCurrentEditorContent,
                        currentYamlObjects: [],
                        selectedYamlObject: undefined,
                        updateSource: UpdateSource.Editor,
                    };
                }
            }
            return state;
        } catch (e) {
            return {
                ...state,
                log: [
                    ...state.log,
                    {
                        datetimeMs: Date.now(),
                        type: LogEntryType.ERROR,
                        message: e as string,
                    },
                ],
            };
        }
    }
    if (action.type === StoreActions.SaveFile) {
        try {
            const file = state.files.find(f => f.uuid === state.activeFileUuid);
            if (file) {
                const filePath = file.editorModel.uri.path;
                fs.writeFileSync(filePath, file.editorModel.getValue(), {
                    encoding: "utf-8",
                    flag: "w",
                });
                return {
                    ...state,
                    files: state.files.map(f =>
                        f.uuid === state.activeFileUuid
                            ? {...f, unsavedChanges: false}
                            : f
                    ),
                };
            }
            return state;
        } catch (e) {
            return {
                ...state,
                log: [
                    ...state.log,
                    {
                        datetimeMs: Date.now(),
                        type: LogEntryType.ERROR,
                        message: e as string,
                    },
                ],
            };
        }
    }
    if (action.type === StoreActions.SaveFileAs) {
        try {
            const file = state.files.find(f => f.uuid === state.activeFileUuid);
            if (file) {
                const filePath = action.payload.filePath;
                fs.writeFileSync(filePath, file.editorModel.getValue(), {
                    encoding: "utf-8",
                    flag: "w",
                });
                const newEditorModel = editor.createModel(
                    file.editorModel.getValue(),
                    "yaml",
                    Uri.parse(action.payload.filePath)
                );
                file.editorModel.dispose();
                return {
                    ...state,
                    files: state.files.map(f =>
                        f.uuid === state.activeFileUuid
                            ? {
                                  ...f,
                                  unsavedChanges: false,
                                  editorModel: newEditorModel,
                              }
                            : f
                    ),
                };
            }
            return state;
        } catch (e) {
            return {
                ...state,
                log: [
                    ...state.log,
                    {
                        datetimeMs: Date.now(),
                        type: LogEntryType.ERROR,
                        message: e as string,
                    },
                ],
            };
        }
    }
    if (action.type === StoreActions.UpdateCurrentContent) {
        state.yamlParserWorker.postMessage({
            type: YamlParserWorkerRequestType.Parse,
            text: action.payload.content,
        });
        const unsavedChanges =
            action.payload.content !==
            (state.files
                .find(el => el.uuid === state.activeFileUuid)
                ?.editorModel.getValue() || "");
        return {
            ...state,
            updateSource: action.payload.source,
            currentEditorContent: action.payload.content,
            files: state.files.map(el =>
                el.uuid === state.activeFileUuid ? {...el, unsavedChanges} : el
            ),
        };
    }
    if (action.type === StoreActions.UpdateCurrentContentAndSetSelection) {
        state.yamlParserWorker.postMessage({
            type: YamlParserWorkerRequestType.ParseAndSetSelection,
            text: action.payload.content,
            startLineNumber: Math.min(
                action.payload.selection.selectionStartLineNumber,
                action.payload.selection.positionLineNumber
            ),
            endLineNumber: Math.max(
                action.payload.selection.selectionStartLineNumber,
                action.payload.selection.positionLineNumber
            ),
        });
        const unsavedChanges =
            action.payload.content !==
            (state.files
                .find(el => el.uuid === state.activeFileUuid)
                ?.editorModel.getValue() || "");
        return {
            ...state,
            currentEditorContent: action.payload.content,
            files: state.files.map(el =>
                el.uuid === state.activeFileUuid ? {...el, unsavedChanges} : el
            ),
        };
    }
    if (action.type === StoreActions.SetCurrentObjectsAndSelection) {
        return {
            ...state,
            currentYamlObjects: action.payload.currentObjects,
            selectedYamlObject: action.payload.selectedObject,
            currentPageId: action.payload.page?.id || "",
        };
    }
    if (action.type === StoreActions.UpdateSelection) {
        const currentFile = state.files.find(
            file => file.uuid === state.activeFileUuid
        );
        if (currentFile) {
            currentFile.selection = action.payload.selection;
            state.yamlParserWorker.postMessage({
                type: YamlParserWorkerRequestType.GetClosestObject,
                startLineNumber: Math.min(
                    action.payload.selection.selectionStartLineNumber,
                    action.payload.selection.positionLineNumber
                ),
                endLineNumber: Math.max(
                    action.payload.selection.selectionStartLineNumber,
                    action.payload.selection.positionLineNumber
                ),
            });
            return {
                ...state,
                updateSource: action.payload.source,
            };
        }
        return state;
    }
    if (action.type === StoreActions.SetSelectedObject) {
        return {
            ...state,
            selectedYamlObject: action.payload.object,
            currentPageId: action.payload.page?.id || "",
        };
    }
    if (action.type === StoreActions.SetCurrentPage) {
        state.yamlParserWorker.postMessage({
            type: YamlParserWorkerRequestType.GetObjectById,
            id: action.payload.pageId,
        });
        return {
            ...state,
            updateSource: action.payload.source,
        };
    }
    if (action.type === StoreActions.SetRecentDocuments) {
        return {
            ...state,
            recentDocuments: action.payload.recentDocuments,
        };
    }
    if (action.type === StoreActions.SetCurrentObjects) {
        return {
            ...state,
            currentYamlObjects: action.payload.currentObjects,
            title: action.payload.title,
            navigationItems: action.payload.navigationItems,
        };
    }
    return state;
};

type Context = {
    state: StoreState;
    dispatch: React.Dispatch<Actions>;
};

const [useStoreContext, StoreContextProvider] = createGenericContext<Context>();

export const StoreProvider: React.FC = props => {
    const [state, dispatch] = React.useReducer(
        StoreReducer,
        initialState,
        StoreReducerInit
    );

    const notifications = useNotifications();

    React.useEffect(() => {
        state.yamlParserWorker.onmessage = (e: MessageEvent) => {
            const data = e.data;
            switch (data.type) {
                case YamlParserWorkerResponseType.Parsed:
                    dispatch({
                        type: StoreActions.SetCurrentObjects,
                        payload: {
                            currentObjects: data.objects,
                            title: data.title,
                            navigationItems: data.navigationItems,
                        },
                    });
                    break;
                case YamlParserWorkerResponseType.ParsedAndSetSelection:
                    dispatch({
                        type: StoreActions.SetCurrentObjectsAndSelection,
                        payload: {
                            currentObjects: data.objects,
                            selectedObject: data.selectedObject,
                            page: data.page,
                        },
                    });
                    break;
                case YamlParserWorkerResponseType.ClosestObject:
                    dispatch({
                        type: StoreActions.SetSelectedObject,
                        payload: {object: data.object, page: data.page},
                    });
                    break;
                case YamlParserWorkerResponseType.ObjectById:
                    dispatch({
                        type: StoreActions.SetSelectedObject,
                        payload: {
                            object: data.object,
                            page: data.object as LayoutObject,
                        },
                    });
                    break;
                default:
            }
        };
        return () => {
            state.yamlParserWorker.terminate();
        };
    }, [state.yamlParserWorker]);

    React.useEffect(() => {
        ipcRenderer.on("file-opened", (event, args) => {
            dispatch({
                type: StoreActions.OpenFile,
                payload: {
                    filePath: args[0],
                },
            });
        });
        ipcRenderer.on("new-file", (event, args) => {
            dispatch({
                type: StoreActions.AddNewFile,
                payload: {},
            });
        });
        ipcRenderer.on("save-file", (event, args) => {
            dispatch({
                type: StoreActions.SaveFile,
                payload: {},
            });
        });
        ipcRenderer.on("save-file-as", (event, arg: string) => {
            dispatch({
                type: StoreActions.SaveFileAs,
                payload: {
                    filePath: arg,
                },
            });
        });
        ipcRenderer.on("update-recent-documents", (event, arg: string[]) => {
            dispatch({
                type: StoreActions.SetRecentDocuments,
                payload: {
                    recentDocuments: arg,
                },
            });
        });
        ipcRenderer.send("get-recent-documents");
    }, [dispatch]);

    return (
        <StoreContextProvider value={{state, dispatch}}>
            {props.children}
        </StoreContextProvider>
    );
};

export const useStore = (): Context => useStoreContext();
