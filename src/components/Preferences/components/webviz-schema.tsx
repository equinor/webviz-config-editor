import {Button, CircularProgress, TextField} from "@mui/material";

import {ipcRenderer} from "electron";

import React from "react";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setPathToYamlSchemaFile} from "@redux/reducers/preferences";

import {FileExplorerOptions} from "@shared-types/file-explorer-options";

import "./preference-item.css";

enum PreferenceItemState {
    VALIDATING = 0,
    VALID,
    INVALID,
}

enum PreferenceItemLoadingState {
    LOADING = 0,
    LOADED,
    ERROR,
}

export const WebvizSchema: React.FC = props => {
    const dispatch = useAppDispatch();

    const [localValue, setLocalValue] = React.useState<string>(
        useAppSelector(state => state.preferences.pathToYamlSchemaFile)
    );
    const [options, setOptions] = React.useState<string[]>([]);
    const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
    const [loadingState, setLoadingState] =
        React.useState<PreferenceItemLoadingState>(
            PreferenceItemLoadingState.LOADED
        );
    const [state, setState] = React.useState<{
        state: PreferenceItemState;
        message: string;
    }>({
        state: PreferenceItemState.VALID,
        message: "",
    });

    React.useEffect(() => {
        setState({state: PreferenceItemState.VALID, message: ""});
        dispatch(setPathToYamlSchemaFile(localValue));
    }, [localValue]);

    const handleValueChanged = (value: string) => {
        setLocalValue(value);
    };

    const openFileDialog = () => {
        const opts: FileExplorerOptions = {
            filters: [
                {
                    name: "Webviz JSON Schema File",
                    extensions: ["json"],
                },
            ],
            defaultPath: localValue,
        };
        ipcRenderer.invoke("select-file", opts).then(files => {
            if (files) {
                setLocalValue(files[0]);
            }
        });
    };

    return (
        <div className="PreferenceItem">
            <span className="PreferenceTitle">Webviz Schema</span>
            <span className="PreferenceDescription">
                Select the Webviz schema file. Read&nbsp;
                <a
                    href="https://equinor.github.io/webviz-config/#/?id=yaml-schema"
                    target="blank"
                >
                    here
                </a>{" "}
                how to create a schemafile.
            </span>
            <div className="PreferenceValue">
                <>
                    {loadingState === PreferenceItemLoadingState.LOADING && (
                        <CircularProgress />
                    )}
                    {loadingState === PreferenceItemLoadingState.LOADED && (
                        <>
                            <TextField
                                aria-readonly
                                className="PreferenceInput"
                                hiddenLabel
                                value={localValue}
                                size="small"
                            />
                            <Button onClick={() => openFileDialog()}>
                                Select
                            </Button>
                        </>
                    )}
                </>
            </div>
        </div>
    );
};
