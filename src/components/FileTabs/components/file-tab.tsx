import "./file-tab.css";
import { Close } from "@mui/icons-material";
import { useTheme } from "@mui/material";
import { FilesStore } from "@stores";
import path from "path";
import React from "react";

export type FileTabProps = {
    uuid: string;
    onSelect: (uuid: string) => void;
};

export const FileTab: React.FC<FileTabProps> = (props) => {
    const [filename, setFilename] = React.useState<string>("");
    const [active, setActive] = React.useState<boolean>(false);
    const [modified, setModified] = React.useState<boolean>(false);
    const store = FilesStore.useStore();

    const theme = useTheme();

    React.useEffect(() => {
        const file = store.state.files.find((el) => el.uuid === props.uuid);
        if (!file) {
            return;
        }
        setFilename(path.basename(file.editorModel.uri.path));
        setModified(file.unsavedChanges);
    }, [store.state.files, props.uuid]);

    React.useEffect(() => {
        setActive(props.uuid === store.state.activeFileUuid);
    }, [store.state.activeFileUuid, props.uuid]);

    const handleClickEvent = () => {
        props.onSelect(props.uuid);
    };

    const handleCloseEvent = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        store.dispatch({ type: FilesStore.StoreActions.CloseFile, payload: { uuid: props.uuid } });
    };

    return (
        <div
            className={`FileTab${active ? " FileTab--active" : ""}${modified ? " FileTab--modified" : ""}`}
            onClick={() => handleClickEvent()}
            style={{
                backgroundColor: active ? theme.palette.action.disabledBackground : theme.palette.background.paper,
                color: theme.palette.text.primary,
            }}
        >
            {filename}
            <div className="FileTab__CloseButton" onClick={(e) => handleCloseEvent(e)}>
                <Close fontSize="inherit" />
            </div>
        </div>
    );
};
