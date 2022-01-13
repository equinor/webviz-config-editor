import "./editor.css";
import {
    AssistantPhoto,
    Error as ErrorIcon,
    FolderOpen,
    Info,
    InsertDriveFile,
    Warning,
} from "@mui/icons-material";
import {Badge, Button, Grid, Paper, Tooltip, useTheme} from "@mui/material";
import useSize from "@react-hook/size";

import {ipcRenderer} from "electron";

import React from "react";
import MonacoEditor, {
    EditorDidMount,
    EditorWillMount,
    monaco,
} from "react-monaco-editor";

import {createBrowserHistory} from "history";
import "monaco-editor";
import {setDiagnosticsOptions} from "monaco-yaml";
import * as path from "path";
import {uuid} from "uuidv4";
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import EditorWorker from "worker-loader!monaco-editor/esm/vs/editor/editor.worker";
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import YamlWorker from "worker-loader!monaco-yaml/lib/esm/yaml.worker";

import {preprocessJsonSchema} from "@utils/json-schema-preprocessor";

import {FileTabs} from "@components/FileTabs";
import {NotificationType, useNotifications} from "@components/Notifications";
import {ResizablePanels} from "@components/ResizablePanels";

import {FilesStore, SettingsStore} from "@stores";

// @ts-ignore
window.MonacoEnvironment = {
    // @ts-ignore
    getWorker(workerId, label) {
        if (label === "yaml") {
            return new YamlWorker();
        }
        return new EditorWorker();
    },
};

type EditorProps = {};

export const Editor: React.FC<EditorProps> = props => {
    const [fontSize, setFontSize] = React.useState<number>(1);
    const [noModels, setNoModels] = React.useState<boolean>(false);
    const [selection, setSelection] = React.useState<monaco.ISelection | null>(
        null
    );
    const [lineDecorations, setLineDecorations] = React.useState<string[]>([]);
    const [markers, setMarkers] = React.useState<monaco.editor.IMarker[]>([]);
    const parserTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
        null
    );

    const monacoEditorRef =
        React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const monacoRef = React.useRef<typeof monaco | null>(null);

    const store = FilesStore.useStore();
    const settingsStore = SettingsStore.useStore();
    const [totalWidth, totalHeight] = useSize(editorRef);

    const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const theme = useTheme();

    const notifications = useNotifications();

    const fontSizes = [
        0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9,
        2,
    ];

    React.useEffect(() => {
        return () => {
            if (timeout.current) {
                clearTimeout(timeout.current);
            }
        };
    });

    const handleCursorPositionChange = (
        e: monaco.editor.ICursorPositionChangedEvent
    ): void => {
        if (
            selection === null ||
            selection.selectionStartLineNumber !== e.position.lineNumber ||
            selection.positionLineNumber !== e.position.lineNumber ||
            selection.selectionStartColumn !== e.position.column ||
            selection.positionColumn !== e.position.column
        ) {
            setSelection(
                new monaco.Selection(
                    e.position.lineNumber,
                    e.position.column,
                    e.position.lineNumber,
                    e.position.column
                )
            );
            if (e.reason === monaco.editor.CursorChangeReason.ContentFlush) {
                return;
            }
            store.dispatch({
                type: FilesStore.StoreActions.UpdateSelection,
                payload: {
                    selection: new monaco.Selection(
                        e.position.lineNumber,
                        e.position.column,
                        e.position.lineNumber,
                        e.position.column
                    ),
                    source: FilesStore.UpdateSource.Editor,
                },
            });
        }
    };

    const handleCursorSelectionChange = (
        e: monaco.editor.ICursorSelectionChangedEvent
    ): void => {
        if (
            selection === null ||
            selection.selectionStartLineNumber !==
                e.selection.selectionStartLineNumber ||
            selection.positionLineNumber !== e.selection.positionLineNumber ||
            selection.selectionStartColumn !==
                e.selection.selectionStartColumn ||
            selection.positionColumn !== e.selection.positionColumn
        ) {
            setSelection(e.selection);
            if (e.reason === monaco.editor.CursorChangeReason.ContentFlush) {
                return;
            }
            store.dispatch({
                type: FilesStore.StoreActions.UpdateSelection,
                payload: {
                    selection: e.selection,
                    source: FilesStore.UpdateSource.Editor,
                },
            });
        }
    };

    const updateLineDecorations = React.useCallback(
        (newDecorations: monaco.editor.IModelDeltaDecoration[]) => {
            if (!monacoEditorRef.current) {
                return;
            }
            setLineDecorations(
                monacoEditorRef.current.deltaDecorations(
                    lineDecorations,
                    newDecorations
                )
            );
        },
        [lineDecorations]
    );

    React.useEffect(() => {
        if (store.state.updateSource === FilesStore.UpdateSource.Plugin) {
            return;
        }
        if (
            monacoEditorRef.current &&
            selection &&
            store.state.selectedYamlObject
        ) {
            updateLineDecorations([
                {
                    range: new monaco.Range(
                        store.state.selectedYamlObject.startLineNumber,
                        0,
                        store.state.selectedYamlObject.endLineNumber,
                        0
                    ),
                    options: {
                        isWholeLine: true,
                        linesDecorationsClassName:
                            "Editor__CurrentObjectDecoration",
                    },
                },
            ]);
            monacoEditorRef.current.revealLinesInCenterIfOutsideViewport(
                store.state.selectedYamlObject.startLineNumber,
                store.state.selectedYamlObject.endLineNumber
            );
        }
    }, [store.state.selectedYamlObject, store.state.updateSource]);

    const handleFileChange = (fileId: string) => {
        const file = store.state.files.find(
            el => el.uuid === store.state.activeFileUuid
        );
        if (file && monacoEditorRef.current) {
            store.dispatch({
                type: FilesStore.StoreActions.SetActiveFile,
                payload: {
                    uuid: fileId,
                    viewState: monacoEditorRef.current.saveViewState(),
                },
            });
        }
        setTimeout(handleMarkersChange, 2000);
    };

    const handleEditorValueChange = (
        e: monaco.editor.IModelContentChangedEvent
    ) => {
        if (e.isFlush) {
            return;
        }
        const model = monacoEditorRef.current?.getModel();
        if (model) {
            if (parserTimer.current) {
                clearTimeout(parserTimer.current);
            }
            parserTimer.current = setTimeout(() => {
                store.dispatch({
                    type: FilesStore.StoreActions.UpdateCurrentContent,
                    payload: {
                        content: model.getValue(),
                        source: FilesStore.UpdateSource.Editor,
                    },
                });
            }, 200);
        }
    };

    const handleMarkersChange = () => {
        if (!monacoRef.current || !monacoEditorRef.current) {
            return;
        }
        setMarkers(
            monacoRef.current.editor.getModelMarkers({
                resource: monacoEditorRef.current.getModel()?.uri,
            })
        );
    };

    const handleEditorDidMount: EditorDidMount = (editor, monacoInstance) => {
        monacoEditorRef.current = editor;
        monacoRef.current = monacoInstance;
        monacoEditorRef.current.onDidChangeModelContent(
            handleEditorValueChange
        );
        monacoEditorRef.current.onDidChangeCursorPosition(
            handleCursorPositionChange
        );
        monacoEditorRef.current.onDidChangeCursorSelection(
            handleCursorSelectionChange
        );
        monacoRef.current.editor.onDidChangeMarkers(handleMarkersChange);
    };

    React.useEffect(() => {
        if (!monacoEditorRef || !monacoEditorRef.current) {
            return;
        }
        monacoEditorRef.current.updateOptions({fontSize: 12 * fontSize});
    }, [fontSize, monacoEditorRef]);

    React.useEffect(() => {
        if (
            store.state.updateSource === FilesStore.UpdateSource.Plugin &&
            monacoEditorRef.current
        ) {
            const model = monacoEditorRef.current.getModel();
            if (model) {
                model.setValue(store.state.currentEditorContent);
            }
        }
    }, [store.state.currentEditorContent, store.state.updateSource]);

    React.useEffect(() => {
        const file = store.state.files.find(
            el => el.uuid === store.state.activeFileUuid
        );
        if (!file) {
            setNoModels(true);
            return;
        }
        if (
            monacoEditorRef.current &&
            file.editorModel !== monacoEditorRef.current.getModel()
        ) {
            monacoEditorRef.current.setModel(file.editorModel);
            if (file.editorViewState) {
                monacoEditorRef.current.restoreViewState(file.editorViewState);
            }
            monacoEditorRef.current.focus();
            setNoModels(false);
        }
    }, [store.state.activeFileUuid, store.state.files]);

    const handleEditorWillMount: EditorWillMount = _ => {
        let jsonSchema;
        const schema = settingsStore.state.settings.find(
            el => el.id === "schema"
        );
        if (schema && schema.value !== "") {
            try {
                jsonSchema = preprocessJsonSchema(schema.value as string);
            } catch (e) {
                notifications.appendNotification({
                    type: NotificationType.ERROR,
                    message: "Invalid JSON schema defined.",
                    action: {
                        label: "Change",
                        action: () => createBrowserHistory().push("/settings"),
                    },
                });
                return;
            }
            setDiagnosticsOptions({
                validate: true,
                enableSchemaRequest: true,
                hover: true,
                format: true,
                completion: true,
                schemas: [
                    {
                        fileMatch: ["*"],
                        schema: jsonSchema,
                        uri: `file://${schema.value || ""}`,
                    },
                ],
            });
        } else {
            notifications.appendNotification({
                type: NotificationType.ERROR,
                message:
                    "No Webviz JSON schema defined. Select a schema in settings.",
                action: {
                    label: "Settings",
                    action: () => {},
                },
            });
        }
    };

    const handleNewFileClick = () => {
        store.dispatch({type: FilesStore.StoreActions.AddNewFile, payload: {}});
    };

    const selectMarker = (marker: monaco.editor.IMarker) => {
        if (monacoEditorRef.current) {
            monacoEditorRef.current.setSelection(
                new monaco.Range(
                    marker.startLineNumber,
                    marker.startColumn,
                    marker.endLineNumber,
                    marker.endColumn
                )
            );
            monacoEditorRef.current.revealLinesInCenterIfOutsideViewport(
                marker.startLineNumber,
                marker.endLineNumber
            );
        }
    };

    const makeIssueKey = (marker: monaco.editor.IMarker): string => {
        return `${marker.resource.toString()}-${marker.startLineNumber}-${
            marker.endLineNumber
        }`;
    };

    return (
        <div
            className="EditorWrapper"
            style={{backgroundColor: theme.palette.background.default}}
        >
            <div
                className="Editor__NoModels"
                style={{
                    display: noModels ? "block" : "none",
                    height: totalHeight,
                }}
            >
                <h2>Webviz Config Editor</h2>
                <h3>Start</h3>
                <Button onClick={() => handleNewFileClick()}>
                    <InsertDriveFile style={{marginRight: 8}} /> New File
                </Button>
                <br />
                <Button onClick={() => ipcRenderer.send("FILE_OPEN")}>
                    <FolderOpen style={{marginRight: 8}} /> Open File
                </Button>
                <br />
                <h3>Recent</h3>
                <ul>
                    {store.state.recentDocuments.map(doc => (
                        <li key={`recent-document:${doc}`}>
                            <Tooltip title={doc} placement="right">
                                <Button
                                    onClick={() =>
                                        store.dispatch({
                                            type: FilesStore.StoreActions
                                                .OpenFile,
                                            payload: {filePath: doc},
                                        })
                                    }
                                >
                                    {path.basename(doc)}
                                </Button>
                            </Tooltip>
                        </li>
                    ))}
                </ul>
            </div>
            <ResizablePanels direction="vertical" id="Editor-Issues">
                <div className="Editor" ref={editorRef}>
                    <FileTabs onFileChange={handleFileChange} />
                    <MonacoEditor
                        language="yaml"
                        defaultValue=""
                        className="YamlEditor"
                        editorDidMount={handleEditorDidMount}
                        editorWillMount={handleEditorWillMount}
                        theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
                        options={{
                            tabSize: 2,
                            insertSpaces: true,
                            quickSuggestions: {other: true, strings: true},
                        }}
                        width={totalWidth}
                        height={totalHeight - 40}
                    />
                </div>
                <div
                    className="Issues"
                    style={{
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                    }}
                >
                    <Paper
                        elevation={1}
                        style={{padding: 16}}
                        sx={{borderRadius: 0}}
                    >
                        <Grid
                            container
                            columnSpacing={2}
                            spacing={5}
                            direction="row"
                            alignItems="center"
                        >
                            <Grid item>
                                <Badge
                                    badgeContent={markers.length}
                                    color="warning"
                                >
                                    <ErrorIcon color="action" />
                                </Badge>
                            </Grid>
                            <Grid item>Issues</Grid>
                        </Grid>
                    </Paper>
                    <div className="IssuesContent">
                        {markers.map(marker => (
                            <div
                                className="Issue"
                                onClick={() => selectMarker(marker)}
                                key={uuid()}
                            >
                                {marker.severity ===
                                monaco.MarkerSeverity.Error ? (
                                    <ErrorIcon color="error" fontSize="small" />
                                ) : marker.severity ===
                                  monaco.MarkerSeverity.Warning ? (
                                    <Warning color="warning" fontSize="small" />
                                ) : marker.severity ===
                                  monaco.MarkerSeverity.Info ? (
                                    <Info color="info" fontSize="small" />
                                ) : (
                                    <AssistantPhoto
                                        color="primary"
                                        fontSize="small"
                                    />
                                )}{" "}
                                {marker.message}
                                <span className="IssuePosition">
                                    [{marker.startLineNumber},{" "}
                                    {marker.startColumn}]
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </ResizablePanels>
        </div>
    );
};
