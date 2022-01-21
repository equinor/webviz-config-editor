import {ipcRenderer} from "electron";

import React from "react";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNewFile} from "@redux/reducers/files";
import {setRecentDocuments} from "@redux/reducers/ui";
import {openFile, saveFile} from "@redux/thunks";
import {saveFileAs} from "@redux/thunks/save-file";

export const IpcService: React.FC = props => {
    const dispatch = useAppDispatch();
    const activeFilePath = useAppSelector(state => state.files.activeFile);
    const currentEditorValue = useAppSelector(
        state =>
            state.files.files
                .find(el => el.filePath === state.files.activeFile)
                ?.editorModel.getValue() || ""
    );

    React.useEffect(() => {
        ipcRenderer.on("file-opened", (event, args) => {
            openFile(args[0], dispatch);
        });
        ipcRenderer.on("new-file", (event, args) => {
            dispatch(addNewFile());
        });
        ipcRenderer.on("save-file", (event, args) => {
            saveFile(activeFilePath, currentEditorValue, dispatch);
        });
        ipcRenderer.on("save-file-as", (event, arg: string) => {
            saveFileAs(activeFilePath, arg, currentEditorValue, dispatch);
        });
        ipcRenderer.on("update-recent-documents", (event, arg: string[]) => {
            setRecentDocuments(arg);
        });
        ipcRenderer.send("get-recent-documents");

        return () => {
            ipcRenderer.removeAllListeners("file-opened");
            ipcRenderer.removeAllListeners("new-file");
            ipcRenderer.removeAllListeners("save-file");
            ipcRenderer.removeAllListeners("save-file-as");
            ipcRenderer.removeAllListeners("update-recent-documents");
        };
    }, [activeFilePath, currentEditorValue, dispatch]);

    return <>{props.children}</>;
};
