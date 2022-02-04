import {ipcRenderer} from "electron";

import React from "react";

import {useMainProcessDataProvider} from "@components/MainProcessDataProvider/main-process-data-provider";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNewFile, clearRecentFiles} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {setInitialConfigurationDone} from "@redux/reducers/uiCoach";
import {openFile, saveFile} from "@redux/thunks";
import {saveFileAs} from "@redux/thunks/save-file";

import {FileExplorerOptions} from "@shared-types/file-explorer-options";
import {NotificationType} from "@shared-types/notifications";

import {useYamlParser} from "./yaml-parser";

export const IpcService: React.FC = props => {
    const dispatch = useAppDispatch();
    const yamlParser = useYamlParser();
    const activeFilePath = useAppSelector(state => state.files.activeFile);
    const associatedWithFile = useAppSelector(
        state =>
            state.files.files.find(el => el.filePath === state.files.activeFile)
                ?.associatedWithFile || false
    );
    const currentEditorValue = useAppSelector(
        state =>
            state.files.files.find(el => el.filePath === state.files.activeFile)
                ?.editorValue || ""
    );
    const mainProcessData = useMainProcessDataProvider();

    React.useEffect(() => {
        ipcRenderer.on("file-opened", (_, args) => {
            openFile(args[0], dispatch, yamlParser);
        });
        ipcRenderer.on("new-file", () => {
            dispatch(addNewFile());
        });
        ipcRenderer.on("save-file", () => {
            if (associatedWithFile) {
                saveFile(activeFilePath, currentEditorValue, dispatch);
                return;
            }
            const options: FileExplorerOptions = {
                filters: [
                    {
                        name: "Webviz Config Files",
                        extensions: ["yml", "yaml"],
                    },
                ],
                action: "save",
                allowMultiple: false,
                title: "Save file as...",
                isDirectoryExplorer: false,
                defaultPath: mainProcessData.userHomeDir,
            };
            ipcRenderer.invoke("save-file", options).then(arg => {
                if (arg) {
                    saveFileAs(
                        activeFilePath,
                        arg,
                        currentEditorValue,
                        dispatch
                    );
                }
            });
        });
        ipcRenderer.on("save-file-as", () => {
            const options: FileExplorerOptions = {
                filters: [
                    {
                        name: "Webviz Config Files",
                        extensions: ["yml", "yaml"],
                    },
                ],
                action: "save",
                allowMultiple: false,
                title: "Save file as...",
                isDirectoryExplorer: false,
                defaultPath: associatedWithFile
                    ? activeFilePath
                    : mainProcessData.userHomeDir,
            };
            ipcRenderer.invoke("save-file", options).then(arg => {
                if (arg) {
                    saveFileAs(
                        activeFilePath,
                        arg,
                        currentEditorValue,
                        dispatch
                    );
                }
            });
        });
        ipcRenderer.on("clear-recent-files", () => {
            dispatch(clearRecentFiles());
        });
        ipcRenderer.on("recent-files-updated", () => {
            dispatch(
                addNotification({
                    type: NotificationType.SUCCESS,
                    message: "Recent files successfully updated.",
                })
            );
        });

        ipcRenderer.on("recent-files-cleared", () => {
            dispatch(
                addNotification({
                    type: NotificationType.SUCCESS,
                    message: "Recent files successfully cleared.",
                })
            );
        });

        ipcRenderer.on("debug:reset-init", () => {
            dispatch(setInitialConfigurationDone(false));
            dispatch(
                addNotification({
                    type: NotificationType.SUCCESS,
                    message: "Initial configuration state reset.",
                })
            );
        });

        return () => {
            ipcRenderer.removeAllListeners("file-opened");
            ipcRenderer.removeAllListeners("new-file");
            ipcRenderer.removeAllListeners("save-file");
            ipcRenderer.removeAllListeners("save-file-as");
            ipcRenderer.removeAllListeners("update-recent-documents");
            ipcRenderer.removeAllListeners("clear-recent-files");
            ipcRenderer.removeAllListeners("recent-files-updated");
            ipcRenderer.removeAllListeners("recent-files-cleared");
            ipcRenderer.removeAllListeners("debug:reset-init");
        };
    }, [
        activeFilePath,
        currentEditorValue,
        dispatch,
        mainProcessData,
        associatedWithFile,
        yamlParser,
    ]);

    return <>{props.children}</>;
};
